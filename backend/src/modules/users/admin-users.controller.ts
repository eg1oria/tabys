import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AdminRole } from '../../prisma/client.js';
import type { AuthUser } from '../../auth/types.js';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Активные администраторы (для назначения заявок)' })
  findAll() {
    return this.users.findAll();
  }

  @Get('all')
  @Roles(AdminRole.OWNER)
  @ApiOperation({ summary: 'Все учётные записи, включая отключённые' })
  findAllForManagement() {
    return this.users.findAllForManagement();
  }

  @Post()
  @Roles(AdminRole.OWNER)
  @ApiOperation({
    summary: 'Создать администратора — временный пароль в ответе, один раз',
  })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthUser) {
    return this.users.create(dto, user);
  }

  @Patch(':id')
  @Roles(AdminRole.OWNER)
  @ApiOperation({ summary: 'Имя, роль, включить или отключить вход' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.users.update(id, dto, user);
  }

  @Post(':id/reset-password')
  @Roles(AdminRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Новый временный пароль, все сессии пользователя завершаются',
  })
  resetPassword(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.users.resetPassword(id, user);
  }
}
