import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator.js';
import { FacetsService, type PublicFacetGroup } from './facets.service.js';

@ApiTags('public')
@Public()
@Controller('public/facets')
export class PublicFacetsController {
  constructor(private readonly facets: FacetsService) {}

  @Get()
  @ApiOperation({ summary: 'Группы фильтров каталога (заменяет filterGroups)' })
  findAll(): Promise<PublicFacetGroup[]> {
    return this.facets.findAllPublic();
  }
}
