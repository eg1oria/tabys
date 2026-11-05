import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service.js';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto.js';
import { ReorderDto } from '../categories/dto/reorder.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { AdminRole } from '../../prisma/client.js';
import type { AuthUser } from '../../auth/types.js';

/** Как категории: правит любой админ, удаляет только владелец. */
@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/projects')
export class AdminProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Все проекты по порядку' })
  findAll() {
    return this.projects.findAllAdmin();
  }

  // Объявлен ДО ':id', иначе PATCH /projects/reorder уедет в :id='reorder'.
  @Patch('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Переставить проекты (весь список целиком)' })
  reorder(
    @Body() dto: ReorderDto,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.projects.reorder(dto.items, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Проект по id' })
  findOne(@Param('id') id: string) {
    return this.projects.findOneAdmin(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать проект' })
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: AuthUser) {
    return this.projects.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Изменить проект (и опубликовать или снять)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.projects.update(id, dto, user);
  }

  @Roles(AdminRole.OWNER)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить проект (только OWNER)' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.projects.remove(id, user);
  }
}
