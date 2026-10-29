import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Query,
  Res,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { LeadsService } from './leads.service.js';
import { QueryLeadsDto } from './dto/query-leads.dto.js';
import { UpdateLeadDto } from './dto/update-lead.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../auth/types.js';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/leads')
export class AdminLeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'Инбокс заявок: фильтр по статусу, поиск, пагинация' })
  findAll(@Query() dto: QueryLeadsDto) {
    return this.leads.findAll(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Заявка целиком' })
  findOne(@Param('id') id: string) {
    return this.leads.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Статус, заметка, ответственный' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.leads.update(id, dto, user);
  }

  @Get(':id/attachments/:attachmentId')
  // nosniff обязателен: иначе браузер может исполнить вложение как html.
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({ summary: 'Скачать вложение (только под авторизацией)' })
  async download(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { stream, filename, bytes } = await this.leads.attachmentStream(id, attachmentId);

    // Всегда attachment и octet-stream: файл присылал посторонний человек,
    // открывать его инлайн в браузере админа незачем.
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(bytes),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    });
    return new StreamableFile(stream);
  }
}
