import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator.js';
import { ProductsService } from './products.service.js';
import { QueryProductsDto } from './dto/query-products.dto.js';

@ApiTags('public')
@Public()
@Controller('public/products')
export class PublicProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Опубликованные товары с фильтрами и поиском' })
  findAll(@Query() dto: QueryProductsDto) {
    return this.products.findAllPublic(dto);
  }

  @Get(':category/:slug')
  @ApiOperation({ summary: 'Товар по слагам категории и товара — для страницы товара' })
  findOne(@Param('category') category: string, @Param('slug') slug: string) {
    return this.products.findOnePublic(category, slug);
  }
}
