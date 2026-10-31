import { ConflictException, NotFoundException } from '@nestjs/common';
import { FacetsService } from './facets.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { AuditService } from '../../common/audit/audit.service.js';
import type { AuthUser } from '../../auth/types.js';

const actor: AuthUser = { id: 'u1', email: 'o@tabys.kz', role: 'OWNER' };

function stub(value: { categories: number; products: number } | null) {
  return {
    facetGroup: { findUnique: vi.fn().mockResolvedValue(null) },
    facetValue: {
      findUnique: vi
        .fn()
        .mockResolvedValue(
          value ? { id: 'f1', value: 'aisi304', _count: value } : null,
        ),
      delete: vi.fn(),
      create: vi.fn(),
    },
  };
}

function service(prisma: ReturnType<typeof stub>) {
  return new FacetsService(
    prisma as unknown as PrismaService,
    { log: vi.fn() } as unknown as AuditService,
  );
}

describe('FacetsService', () => {
  it('используемое значение не удаляется: каскад молча снял бы фильтры', async () => {
    const prisma = stub({ categories: 1, products: 3 });
    await expect(service(prisma).removeValue('f1', actor)).rejects.toThrow(
      /используется в 4 записях/,
    );
    expect(prisma.facetValue.delete).not.toHaveBeenCalled();
  });

  it('неиспользуемое — удаляется', async () => {
    const prisma = stub({ categories: 0, products: 0 });
    await service(prisma).removeValue('f1', actor);
    expect(prisma.facetValue.delete).toHaveBeenCalledWith({
      where: { id: 'f1' },
    });
  });

  it('несуществующее значение — 404', async () => {
    await expect(
      service(stub(null)).removeValue('x', actor),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('значение в неизвестную группу не добавляется', async () => {
    const prisma = stub(null);
    await expect(
      service(prisma).createValue(
        { groupKey: 'nope', value: 'v', label: 'V' },
        actor,
      ),
    ).rejects.toThrow(/nope/);
    expect(prisma.facetValue.create).not.toHaveBeenCalled();
  });

  it('конфликт — это 409, а не 400', async () => {
    const prisma = stub({ categories: 0, products: 1 });
    await expect(
      service(prisma).removeValue('f1', actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
