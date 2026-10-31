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
import { FacetsService } from './facets.service.js';
import { CreateFacetValueDto } from './dto/create-facet-value.dto.js';
import { UpdateFacetValueDto } from './dto/update-facet-value.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { AdminRole } from '../../prisma/client.js';
import type { AuthUser } from '../../auth/types.js';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/facets')
export class AdminFacetsController {
  constructor(private readonly facets: FacetsService) {}

  @Get()
  @ApiOperation({ summary: 'Группы фасетов со значениями и счётчиками' })
  findAll() {
    return this.facets.findAllAdmin();
  }

  // Значения фильтров — устройство каталога: от них зависят фильтры
  // на сайте и привязки во всех товарах категории.
  @Post('values')
  @Roles(AdminRole.OWNER)
  @ApiOperation({ summary: 'Добавить значение фильтра' })
  create(@Body() dto: CreateFacetValueDto, @CurrentUser() user: AuthUser) {
    return this.facets.createValue(dto, user);
  }

  @Patch('values/:id')
  @Roles(AdminRole.OWNER)
  @ApiOperation({ summary: 'Переименовать значение или изменить порядок' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFacetValueDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.facets.updateValue(id, dto, user);
  }

  @Delete('values/:id')
  @Roles(AdminRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить неиспользуемое значение' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<void> {
    return this.facets.removeValue(id, user);
  }
}
