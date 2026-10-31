import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LeadsService, LEAD_CREATED, canTransition } from './leads.service.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';
import { LeadStatus } from '../../prisma/client.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { AppConfigService } from '../../config/app-config.service.js';
import type { AuditService } from '../../common/audit/audit.service.js';
import type { EventEmitter2 } from '@nestjs/event-emitter';
import type { AuthUser } from '../../auth/types.js';

const actor: AuthUser = { id: 'u1', email: 'o@tabys.kz', role: 'OWNER' };
const { NEW, IN_PROGRESS, DONE, SPAM } = LeadStatus;

function stub(
  lead: Record<string, unknown> | null = {
    id: 'l1',
    status: NEW,
    assignedToId: null,
  },
) {
  return {
    lead: {
      findUnique: vi.fn().mockResolvedValue(lead),
      findUniqueOrThrow: vi.fn().mockResolvedValue(lead),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      create: vi.fn().mockResolvedValue({ id: 'l1', status: NEW }),
    },
    leadAttachment: { create: vi.fn() },
    adminUser: { findUnique: vi.fn().mockResolvedValue({ isActive: true }) },
  };
}

function service(prisma: ReturnType<typeof stub>, uploadDir = '/nonexistent') {
  const events = { emit: vi.fn() };
  const svc = new LeadsService(
    prisma as unknown as PrismaService,
    { uploadDir } as AppConfigService,
    { log: vi.fn() } as unknown as AuditService,
    events as unknown as EventEmitter2,
  );
  return { svc, events };
}

function leadDto(extra: Record<string, unknown> = {}): CreateLeadDto {
  return plainToInstance(CreateLeadDto, {
    name: 'Покупатель',
    phone: '+7 707 267 12 37',
    consent: 'on',
    ...extra,
  });
}

describe('canTransition — жизненный цикл заявки', () => {
  // Строка — откуда, столбцы — куда: NEW, IN_PROGRESS, DONE, SPAM.
  const matrix: [LeadStatus, boolean[]][] = [
    [NEW, [true, true, true, true]],
    [IN_PROGRESS, [true, true, true, true]],
    // Закрытую заявку возвращают в работу, а не в «новые»: «новые» — это
    // то, что ещё никто не видел, и на них смотрит счётчик в меню.
    [DONE, [false, true, true, true]],
    // Спам можно только вернуть во входящие — разобрать заново.
    [SPAM, [true, false, false, true]],
  ];
  const targets = [NEW, IN_PROGRESS, DONE, SPAM];

  for (const [from, row] of matrix) {
    targets.forEach((to, i) => {
      it(`${from} → ${to}: ${row[i] ? 'можно' : 'нельзя'}`, () => {
        expect(canTransition(from, to)).toBe(row[i]);
      });
    });
  }
});

describe('LeadsService.update', () => {
  it('недопустимый переход — 400, в базу ничего не пишется', async () => {
    const prisma = stub({ id: 'l1', status: SPAM, assignedToId: null });
    const { svc } = service(prisma);

    await expect(
      svc.update('l1', { status: DONE }, actor),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.lead.updateMany).not.toHaveBeenCalled();
  });

  it('смена статуса пишется с условием на прежний статус', async () => {
    const prisma = stub();
    const { svc } = service(prisma);

    await svc.update('l1', { status: IN_PROGRESS }, actor);

    expect(prisma.lead.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'l1', status: NEW } }),
    );
  });

  it('если статус успели поменять параллельно — 409', async () => {
    const prisma = stub();
    prisma.lead.updateMany.mockResolvedValue({ count: 0 });
    const { svc } = service(prisma);

    await expect(
      svc.update('l1', { status: DONE }, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('правка заметки статус не сторожит', async () => {
    const prisma = stub();
    const { svc } = service(prisma);

    await svc.update('l1', { internalNote: 'перезвонить' }, actor);

    expect(prisma.lead.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'l1' } }),
    );
  });

  it('нет заявки — 404', async () => {
    const { svc } = service(stub(null));
    await expect(
      svc.update('nope', { status: DONE }, actor),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('назначить на отключённого администратора нельзя', async () => {
    const prisma = stub();
    prisma.adminUser.findUnique.mockResolvedValue({ isActive: false });
    const { svc } = service(prisma);

    await expect(
      svc.update('l1', { assignedToId: 'u2' }, actor),
    ).rejects.toThrow(/отключён/);
    expect(prisma.lead.updateMany).not.toHaveBeenCalled();
  });

  it('…но заявку, уже назначенную на него, править можно', async () => {
    const prisma = stub({ id: 'l1', status: NEW, assignedToId: 'u2' });
    prisma.adminUser.findUnique.mockResolvedValue({ isActive: false });
    const { svc } = service(prisma);

    await svc.update('l1', { assignedToId: 'u2', internalNote: 'ок' }, actor);

    expect(prisma.adminUser.findUnique).not.toHaveBeenCalled();
    expect(prisma.lead.updateMany).toHaveBeenCalled();
  });

  it('снять ответственного можно всегда', async () => {
    const prisma = stub({ id: 'l1', status: NEW, assignedToId: 'u2' });
    const { svc } = service(prisma);

    await svc.update('l1', { assignedToId: null }, actor);

    expect(prisma.adminUser.findUnique).not.toHaveBeenCalled();
  });
});

describe('LeadsService.create', () => {
  let uploads: string;

  beforeEach(async () => {
    uploads = await mkdtemp(join(tmpdir(), 'tabys-leads-'));
  });
  afterEach(async () => {
    await rm(uploads, { recursive: true, force: true });
  });

  it('обычная заявка — NEW, телефон в каноническом виде, уходит уведомление', async () => {
    const prisma = stub();
    const { svc, events } = service(prisma, uploads);

    await svc.create(leadDto(), undefined, { ip: '1.2.3.4' });

    expect(prisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: NEW,
          phone: '+7 (707) 267-12-37',
          phoneDigits: '77072671237',
        }),
      }),
    );
    expect(events.emit).toHaveBeenCalledWith(LEAD_CREATED, { leadId: 'l1' });
  });

  it('заполненная ловушка для ботов — SPAM без уведомления, но ответ успешный', async () => {
    const prisma = stub();
    prisma.lead.create.mockResolvedValue({ id: 'l1', status: SPAM });
    const { svc, events } = service(prisma, uploads);

    const result = await svc.create(
      leadDto({ companyWebsite: 'http://spam.example' }),
      undefined,
      {},
    );

    expect(prisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: SPAM }),
      }),
    );
    expect(result.status).toBe(SPAM);
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('форма, отправленная быстрее двух секунд после показа, — спам', () => {
    expect(
      leadDto({ renderedAt: String(Date.now() - 500) }).looksAutomated,
    ).toBe(true);
    expect(
      leadDto({ renderedAt: String(Date.now() - 5000) }).looksAutomated,
    ).toBe(false);
  });

  it('файл проверяется до записи заявки: отказ не оставляет сироту', async () => {
    const prisma = stub();
    const { svc } = service(prisma, uploads);

    const exe = {
      originalname: 'setup.exe',
      buffer: Buffer.from('MZ'),
      size: 2,
    };
    await expect(svc.create(leadDto(), exe, {})).rejects.toThrow(/формат/);

    const fakePdf = {
      originalname: 'tz.pdf',
      buffer: Buffer.from('not a pdf'),
      size: 9,
    };
    await expect(svc.create(leadDto(), fakePdf, {})).rejects.toThrow(
      /не соответствует/,
    );

    const huge = {
      originalname: 'tz.pdf',
      buffer: Buffer.alloc(1),
      size: 5 * 1024 * 1024,
    };
    await expect(svc.create(leadDto(), huge, {})).rejects.toThrow(/4 МБ/);

    expect(prisma.lead.create).not.toHaveBeenCalled();
    expect(await readdir(uploads)).toEqual([]);
  });

  it('чертёж без сигнатуры принимается по расширению и ложится в leads/', async () => {
    const prisma = stub();
    const { svc } = service(prisma, uploads);

    const dwg = {
      originalname: 'чертёж.dwg',
      buffer: Buffer.from('AC1032'),
      size: 6,
    };
    await svc.create(leadDto(), dwg, {});

    expect(prisma.leadAttachment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'l1',
        originalName: 'чертёж.dwg',
        storageKey: expect.stringMatching(
          /^leads\/\d{4}\/\d{2}\/[0-9a-f-]+\.dwg$/,
        ),
      }),
    });
    expect(await readdir(join(uploads, 'leads'))).toHaveLength(1);
  });
});
