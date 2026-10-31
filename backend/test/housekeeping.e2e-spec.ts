import type { INestApplication } from '@nestjs/common';
import {
  mkdir,
  mkdtemp,
  readdir,
  rm,
  utimes,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createTestApp, truncateAll } from './helpers.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { Housekeeping } from '../src/modules/housekeeping/housekeeping.service.js';
import type { AppConfigService } from '../src/config/app-config.service.js';

const DAY = 24 * 60 * 60_000;

describe('Уборка (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let housekeeping: Housekeeping;
  let uploads: string;
  let userId: string;
  const now = new Date();

  /** Файл с заданным возрастом: уборка смотрит на mtime. */
  async function file(key: string, ageMs = 2 * DAY): Promise<void> {
    const path = join(uploads, key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, 'x');
    const at = new Date(now.getTime() - ageMs);
    await utimes(path, at, at);
  }

  async function listFiles(): Promise<string[]> {
    const entries = await readdir(uploads, {
      recursive: true,
      withFileTypes: true,
    });
    return entries
      .filter((e) => e.isFile())
      .map((e) => join(e.parentPath, e.name).slice(uploads.length + 1))
      .sort();
  }

  beforeAll(async () => {
    // Свой каталог: в общем test/tmp-uploads лежат вложения других тестов,
    // а конфиг приложения читает UPLOAD_DIR ещё при импорте модуля.
    uploads = await mkdtemp(join(tmpdir(), 'tabys-housekeeping-'));
    app = await createTestApp();
    prisma = app.get(PrismaService);
    const config = { uploadDir: uploads, auditRetentionDays: 365 };
    housekeeping = new Housekeeping(prisma, config as AppConfigService);
  });

  beforeEach(async () => {
    await truncateAll(prisma);
    await rm(uploads, { recursive: true, force: true });
    await mkdir(uploads, { recursive: true });
    ({ id: userId } = await prisma.adminUser.create({
      data: {
        email: 'hk@tabys.kz',
        name: 'HK',
        role: 'OWNER',
        passwordHash: 'x',
      },
    }));
  });

  afterAll(async () => {
    await truncateAll(prisma);
    await app?.close();
    await rm(uploads, { recursive: true, force: true });
  });

  it('удаляет истёкшие токены и коды, старый аудит — и не трогает живое', async () => {
    const token = (hash: string, expiresAt: Date) => ({
      userId,
      tokenHash: hash,
      familyId: 'f',
      expiresAt,
    });
    await prisma.refreshToken.createMany({
      data: [
        token('expired', new Date(now.getTime() - DAY)),
        token('live', new Date(now.getTime() + DAY)),
      ],
    });
    await prisma.telegramLinkCode.createMany({
      data: [
        {
          code: 'old',
          createdById: userId,
          expiresAt: new Date(now.getTime() - 1000),
        },
        {
          code: 'new',
          createdById: userId,
          expiresAt: new Date(now.getTime() + 60_000),
        },
      ],
    });
    await prisma.auditLog.createMany({
      data: [
        {
          action: 'a',
          entity: 'X',
          createdAt: new Date(now.getTime() - 400 * DAY),
        },
        {
          action: 'b',
          entity: 'X',
          createdAt: new Date(now.getTime() - 10 * DAY),
        },
      ],
    });

    const report = await housekeeping.run(now);

    expect(report).toMatchObject({
      refreshTokens: 1,
      linkCodes: 1,
      auditLogs: 1,
    });
    expect(
      await prisma.refreshToken.findMany({ select: { tokenHash: true } }),
    ).toEqual([{ tokenHash: 'live' }]);
    expect(await prisma.telegramLinkCode.count()).toBe(1);
    expect((await prisma.auditLog.findMany()).map((r) => r.action)).toEqual([
      'b',
    ]);
  });

  it('удаляет файлы без записи в базе, но не свежие и не служебные', async () => {
    await prisma.mediaAsset.create({
      data: {
        storageKey: '2026/10/photo.jpg',
        originalName: 'photo.jpg',
        mimeType: 'image/jpeg',
        bytes: 1,
        derivatives: { '400': '2026/10/photo-400.webp' },
      },
    });
    const lead = await prisma.lead.create({
      data: { name: 'К', phone: '+7', phoneDigits: '7', consentAt: now },
    });
    await prisma.leadAttachment.create({
      data: {
        leadId: lead.id,
        storageKey: 'leads/2026/10/tz.pdf',
        originalName: 'tz.pdf',
        mimeType: 'application/pdf',
        bytes: 1,
      },
    });

    await file('2026/10/photo.jpg');
    await file('2026/10/photo-400.webp');
    await file('leads/2026/10/tz.pdf');
    await file('2026/10/orphan.jpg');
    await file('leads/2026/10/orphan.pdf');
    await file('2026/10/uploading-now.jpg', 60_000);
    await file('.gitkeep');

    const report = await housekeeping.run(now);

    expect(report.orphanFiles).toBe(2);
    expect(await listFiles()).toEqual([
      '.gitkeep',
      '2026/10/photo-400.webp',
      '2026/10/photo.jpg',
      '2026/10/uploading-now.jpg',
      'leads/2026/10/tz.pdf',
    ]);
  });

  it('не удаляет ничего, если «лишней» оказалась бо́льшая часть файлов', async () => {
    await prisma.mediaAsset.create({
      data: {
        storageKey: 'keep.jpg',
        originalName: 'keep.jpg',
        mimeType: 'image/jpeg',
        bytes: 1,
      },
    });
    await file('keep.jpg');
    for (let i = 0; i < 25; i++) await file(`old/${i}.jpg`);

    const report = await housekeeping.run(now);

    expect(report.orphanFiles).toBe(0);
    expect(report.filesSkipped).toMatch(/ошибку конфигурации/);
    expect(await listFiles()).toHaveLength(26);
  });
});
