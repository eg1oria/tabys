import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../../common/audit/audit.service.js';
import { normalizePhone } from '../../common/phone/phone.js';
import type { SiteContacts } from '../../prisma/client.js';
import type { AuthUser } from '../../auth/types.js';
import type { UpdateContactsDto } from './dto/update-contacts.dto.js';

const ROW_ID = 1;

export type ContactPhone = {
  label: string;
  /** Цифры с кодом страны: 77072671237 — для tel: и wa.me. */
  digits: string;
  /** +7 (707) 267-12-37 — как показывать. */
  display: string;
};

export type Contacts = {
  address: string;
  addressShort: string;
  mapUrl: string;
  email: string;
  phones: ContactPhone[];
  whatsapp: string | null;
  telegram: string | null;
  instagram: string | null;
  youtube: string | null;
  updatedAt: string;
};

/** В базе номера — только цифры; вид для глаз собираем при чтении. */
function readPhones(value: unknown): ContactPhone[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return [];
    const { label, digits } = item as { label?: unknown; digits?: unknown };
    if (typeof label !== 'string' || typeof digits !== 'string') return [];
    const phone = normalizePhone(`+${digits}`);
    return phone
      ? [{ label, digits: phone.digits, display: phone.display }]
      : [];
  });
}

function toContacts(row: SiteContacts): Contacts {
  return {
    address: row.address,
    addressShort: row.addressShort,
    mapUrl: row.mapUrl,
    email: row.email,
    phones: readPhones(row.phones),
    whatsapp: row.whatsapp,
    telegram: row.telegram,
    instagram: row.instagram,
    youtube: row.youtube,
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Строку кладёт миграция; 404 — сайт покажет контакты из своего кода. */
  async get(): Promise<Contacts> {
    const row = await this.prisma.siteContacts.findUnique({
      where: { id: ROW_ID },
    });
    if (!row) throw new NotFoundException('Контакты не заполнены');
    return toContacts(row);
  }

  async update(dto: UpdateContactsDto, actor: AuthUser): Promise<Contacts> {
    const before = await this.prisma.siteContacts.findUnique({
      where: { id: ROW_ID },
    });

    const data = {
      address: dto.address,
      addressShort: dto.addressShort,
      mapUrl: dto.mapUrl,
      email: dto.email,
      // DTO уже проверил, что каждый номер разбирается.
      phones: dto.phones.map(({ label, phone }) => ({
        label,
        digits: normalizePhone(phone)?.digits ?? '',
      })),
      whatsapp: dto.whatsapp ?? null,
      telegram: dto.telegram ?? null,
      instagram: dto.instagram ?? null,
      youtube: dto.youtube ?? null,
    };

    const row = await this.prisma.siteContacts.upsert({
      where: { id: ROW_ID },
      create: { id: ROW_ID, ...data },
      update: data,
    });

    const after = toContacts(row);
    await this.audit.log({
      actor,
      action: 'contacts.update',
      entity: 'SiteContacts',
      entityId: String(ROW_ID),
      before: before ? toContacts(before) : undefined,
      after,
    });
    return after;
  }
}
