import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../../common/audit/audit.service.js';
import type { AuthUser } from '../../auth/types.js';
import type { CreateFacetValueDto } from './dto/create-facet-value.dto.js';
import type { UpdateFacetValueDto } from './dto/update-facet-value.dto.js';

/** То, что раньше было хардкодом filterGroups на фронтенде. */
export type PublicFacetGroup = {
  key: string;
  title: string;
  singleSelect: boolean;
  options: { value: string; label: string }[];
};

@Injectable()
export class FacetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Группы со значениями — источник правды для фильтров каталога. */
  async findAllPublic(): Promise<PublicFacetGroup[]> {
    const groups = await this.prisma.facetGroup.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        key: true,
        title: true,
        singleSelect: true,
        values: {
          orderBy: { sortOrder: 'asc' },
          select: { value: true, label: true },
        },
      },
    });

    return groups.map((g) => ({
      key: g.key,
      title: g.title,
      singleSelect: g.singleSelect,
      options: g.values,
    }));
  }

  findAllAdmin() {
    return this.prisma.facetGroup.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        values: {
          orderBy: { sortOrder: 'asc' },
          include: { _count: { select: { categories: true, products: true } } },
        },
      },
    });
  }

  async createValue(dto: CreateFacetValueDto, actor: AuthUser) {
    const group = await this.prisma.facetGroup.findUnique({
      where: { key: dto.groupKey },
      select: { id: true },
    });
    if (!group) throw new NotFoundException(`Группа фасетов ${dto.groupKey} не найдена`);

    const created = await this.prisma.facetValue.create({
      data: {
        groupId: group.id,
        value: dto.value,
        label: dto.label,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    await this.audit.log({
      actor,
      action: 'facetValue.create',
      entity: 'FacetValue',
      entityId: created.id,
      after: created,
    });
    return created;
  }

  async updateValue(id: string, dto: UpdateFacetValueDto, actor: AuthUser) {
    const before = await this.prisma.facetValue.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Значение фасета не найдено');

    const updated = await this.prisma.facetValue.update({ where: { id }, data: dto });

    await this.audit.log({
      actor,
      action: 'facetValue.update',
      entity: 'FacetValue',
      entityId: id,
      before,
      after: updated,
    });
    return updated;
  }

  async removeValue(id: string, actor: AuthUser): Promise<void> {
    const before = await this.prisma.facetValue.findUnique({
      where: { id },
      include: { _count: { select: { categories: true, products: true } } },
    });
    if (!before) throw new NotFoundException('Значение фасета не найдено');

    // Каскад снял бы связи молча — а это тихая потеря фильтров у категорий.
    const used = before._count.categories + before._count.products;
    if (used > 0) {
      throw new ConflictException(
        `Значение используется в  записях — сначала снимите его с них`,
      );
    }

    await this.prisma.facetValue.delete({ where: { id } });
    await this.audit.log({
      actor,
      action: 'facetValue.delete',
      entity: 'FacetValue',
      entityId: id,
      before,
    });
  }
}
