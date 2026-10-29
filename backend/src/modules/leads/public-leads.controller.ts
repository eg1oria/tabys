import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../auth/decorators/public.decorator.js';
import { LeadsService } from './leads.service.js';
import { CreateLeadDto } from './dto/create-lead.dto.js';
import { MAX_FILE_BYTES } from './lead-file.constants.js';
import type { LeadStatus } from '../../prisma/client.js';

@ApiTags('public')
@Public()
@Controller('public/leads')
export class PublicLeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post()
  // Форма заявки — публичная запись, единственная в API. 20 в час на IP:
  // живому посетителю хватает с запасом, массовой рассылке — нет.
  @Throttle({ default: { ttl: 3_600_000, limit: 20 } })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'phone', 'consent'],
      properties: {
        name: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
        message: { type: 'string' },
        consent: { type: 'string', example: 'true' },
        companyWebsite: { type: 'string', description: 'honeypot, оставьте пустым' },
        renderedAt: { type: 'string', description: 'Date.now() на момент показа формы' },
        attachment: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Приём заявки с сайта' })
  @UseInterceptors(
    FileInterceptor('attachment', {
      // В память: тип по магическим байтам проверяем до записи на диск.
      limits: { fileSize: MAX_FILE_BYTES, files: 1, fields: 20 },
    }),
  )
  create(
    @Body() dto: CreateLeadDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ): Promise<{ id: string; status: LeadStatus }> {
    return this.leads.create(dto, file, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
}
