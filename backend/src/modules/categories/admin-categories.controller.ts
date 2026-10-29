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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { QueryCategoriesDto } from './dto/query-categories.dto.js';
import { ReorderDto } from './dto/reorder.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { AdminRole, PublishStatus } from '../../prisma/client.js';
import type { AuthUser } from '../../auth/types.js';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Список категорий с пагинацией и поиском' })
  findAll(@Query() dto: QueryCategoriesDto) {
    return this.categories.findAllAdmin(dto);
  }

  // Объявлен ДО ':id', иначе PATCH /categories/reorder уедет в :id='reorder'.
  @Patch('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Переставить категории (весь список целиком)' })
  reorder(@Body() dto: ReorderDto, @CurrentUser() user: AuthUser): Promise<void> {
    return this.categories.reorder(dto.items, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Категория по id' })
  findOne(@Param('id') id: string) {
    return this.categories.findOneAdmin(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать категорию (слаг — из названия)' })
  create(@Body() dto: CreateCategoryDto, @CurrentUser() user: AuthUser) {
    return this.categories.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Изменить категорию' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.categories.update(id, dto, user);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Опубликовать' })
  publish(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.categories.setStatus(id, PublishStatus.PUBLISHED, user);
  }

  @Patch(':id/unpublish')
  @ApiOperation({ summary: 'Снять с публикации' })
  unpublish(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.categories.setStatus(id, PublishStatus.DRAFT, user);
  }

  @Roles(AdminRole.OWNER)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить категорию вместе с её товарами (только OWNER)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<void> {
    return this.categories.remove(id, user);
  }
}
