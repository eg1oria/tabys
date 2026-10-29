import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator.js';
import { CategoriesService } from './categories.service.js';

@ApiTags('public')
@Public()
@Controller('public/categories')
export class PublicCategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Опубликованные категории каталога' })
  findAll() {
    return this.categories.findAllPublic();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Категория по слагу' })
  findOne(@Param('slug') slug: string) {
    return this.categories.findOnePublic(slug);
  }
}
