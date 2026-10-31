import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service.js';
import { QueryAuditDto } from './dto/query-audit.dto.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { AdminRole } from '../../prisma/client.js';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  /**
   * Только владельцу: в журнале видно, кто кого завёл и отключил и чьи
   * сессии сбрасывали, — редактору это знать незачем.
   */
  @Get()
  @Roles(AdminRole.OWNER)
  @ApiOperation({ summary: 'Журнал действий админки, новые сверху' })
  findAll(@Query() dto: QueryAuditDto) {
    return this.audit.findAll(dto);
  }
}
