import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator.js';
import { PublicCache } from '../../common/http/cache-control.js';
import { ProjectsService } from './projects.service.js';

@ApiTags('public')
@Public()
@PublicCache()
@Controller('public/projects')
export class PublicProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Опубликованные проекты по порядку' })
  findAll() {
    return this.projects.findAllPublic();
  }
}
