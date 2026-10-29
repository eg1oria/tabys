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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { QueryProductsDto } from './dto/query-products.dto.js';
import { ReorderDto } from '../categories/dto/reorder.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PublishStatus } from '../../prisma/client.js';
import type { AuthUser } from '../../auth/types.js';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Список товаров' })
  findAll(@Query() dto: QueryProductsDto) {
    return this.products.findAllAdmin(dto);
  }

  // До ':id' — иначе маршрут перехватывается как id='reorder'.
  @Patch('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Переставить товары' })
  reorder(@Body() dto: ReorderDto, @CurrentUser() user: AuthUser): Promise<void> {
    return this.products.reorder(dto.items, user);
  }

  // Тоже до ':id': иначе 'export' попадёт в параметр.
  @Get('export')
  @ApiOperation({ summary: 'Выгрузить список в CSV' })
  async export(@Query() dto: QueryProductsDto, @Res({ passthrough: true }) res: Response) {
    const csv = await this.products.exportCsv(dto);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="tabys-products.csv"',
      'Cache-Control': 'no-store',
    });
    // BOM: без него Excel открывает кириллицу как кракозябры.
    return `\uFEFF${csv}`;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Товар по id' })
  findOne(@Param('id') id: string) {
    return this.products.findOneAdmin(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать товар' })
  create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthUser) {
    return this.products.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Изменить товар' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.products.update(id, dto, user);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Опубликовать' })
  publish(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.products.setStatus(id, PublishStatus.PUBLISHED, user);
  }

  @Patch(':id/unpublish')
  @ApiOperation({ summary: 'Снять с публикации' })
  unpublish(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.products.setStatus(id, PublishStatus.DRAFT, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить товар' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<void> {
    return this.products.remove(id, user);
  }
}
