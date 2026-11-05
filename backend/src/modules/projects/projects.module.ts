import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service.js';
import { PublicProjectsController } from './public-projects.controller.js';
import { AdminProjectsController } from './admin-projects.controller.js';

@Module({
  controllers: [PublicProjectsController, AdminProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
