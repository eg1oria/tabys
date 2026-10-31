import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PasswordService } from '../../auth/password.service.js';
import { TokenService } from '../../auth/token.service.js';
import { AuditService } from '../../common/audit/audit.service.js';
import { prismaCode } from '../../common/filters/all-exceptions.filter.js';
import { AdminRole, type Prisma } from '../../prisma/client.js';
import type { AuthUser } from '../../auth/types.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';

/** Явный select: passwordHash не должен покидать базу ни при какой правке. */
const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} satisfies Prisma.AdminUserSelect;

/**
 * Временный пароль: 16 символов base64url, 96 бит случайности. Показывается
 * владельцу один раз, дальше администратор меняет его в «Настройках».
 */
function temporaryPassword(): string {
  return randomBytes(12).toString('base64url');
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  /** Список для назначения ответственного по заявке — только активные. */
  findAll() {
    return this.prisma.adminUser.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
  }

  /** Все учётные записи, включая отключённые, — для раздела «Администраторы». */
  findAllForManagement() {
    return this.prisma.adminUser.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      select: USER_SELECT,
    });
  }

  async create(dto: CreateUserDto, actor: AuthUser) {
    const password = temporaryPassword();
    const user = await this.prisma.adminUser
      .create({
        data: {
          email: dto.email,
          name: dto.name,
          role: dto.role,
          passwordHash: await this.passwords.hash(password),
        },
        select: USER_SELECT,
      })
      .catch((error: unknown) => {
        if (prismaCode(error) === 'P2002') {
          throw new ConflictException('Администратор с таким email уже есть');
        }
        throw error;
      });

    await this.audit.log({
      actor,
      action: 'user.create',
      entity: 'AdminUser',
      entityId: user.id,
      after: user,
    });
    return { user, password };
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthUser) {
    const losesOwner = dto.role === AdminRole.EDITOR || dto.isActive === false;

    if (id === actor.id && (dto.role !== undefined || dto.isActive === false)) {
      // Иначе владелец одним кликом отрезает доступ самому себе.
      throw new BadRequestException(
        'Свою роль и доступ может поменять только другой владелец',
      );
    }

    const { before, after } = await this.prisma.$transaction(async (tx) => {
      // Блокируем строки активных владельцев: два владельца, параллельно
      // понижающие друг друга, иначе оба прошли бы проверку ниже
      // и оставили админку без единого OWNER.
      await tx.$queryRaw`
        SELECT id FROM "AdminUser"
        WHERE role = 'OWNER' AND "isActive" = true
        FOR UPDATE
      `;
      const before = await tx.adminUser.findUnique({
        where: { id },
        select: USER_SELECT,
      });
      if (!before) throw new NotFoundException('Администратор не найден');

      if (losesOwner && before.role === AdminRole.OWNER && before.isActive) {
        const owners = await tx.adminUser.count({
          where: { role: AdminRole.OWNER, isActive: true, id: { not: id } },
        });
        if (owners === 0) {
          throw new BadRequestException(
            'Это последний владелец: сначала назначьте владельцем кого-то ещё',
          );
        }
      }

      const after = await tx.adminUser.update({
        where: { id },
        data: { name: dto.name, role: dto.role, isActive: dto.isActive },
        select: USER_SELECT,
      });
      return { before, after };
    });

    // Access-токен отключённого и так не пройдёт гвард (он сверяется
    // с базой), а refresh-токены гасим, чтобы сессии не ожили после
    // повторного включения.
    if (before.isActive && !after.isActive) {
      await this.tokens.revokeAllForUser(id);
    }

    await this.audit.log({
      actor,
      action: 'user.update',
      entity: 'AdminUser',
      entityId: id,
      before,
      after,
    });
    return after;
  }

  /**
   * Сброс забытого пароля владельцем. Все сессии пользователя завершаются:
   * если пароль сбрасывают из-за утечки, старые входы жить не должны.
   */
  async resetPassword(id: string, actor: AuthUser) {
    if (id === actor.id) {
      throw new BadRequestException(
        'Свой пароль меняйте в «Настройках» — там нужен текущий',
      );
    }
    const exists = await this.prisma.adminUser.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Администратор не найден');

    const password = temporaryPassword();
    await this.prisma.adminUser.update({
      where: { id },
      data: { passwordHash: await this.passwords.hash(password) },
    });
    await this.tokens.revokeAllForUser(id);

    await this.audit.log({
      actor,
      action: 'user.password.reset',
      entity: 'AdminUser',
      entityId: id,
    });
    return { password };
  }
}
