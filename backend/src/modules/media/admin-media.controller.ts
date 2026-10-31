import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MediaService } from './media.service.js';
import { UploadMediaDto } from './dto/upload-media.dto.js';
import { UpdateMediaDto } from './dto/update-media.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { AdminRole } from '../../prisma/client.js';
import type { AuthUser } from '../../auth/types.js';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/media')
export class AdminMediaController {
  constructor(private readonly media: MediaService) {}

  @Get()
  @ApiOperation({ summary: 'Загруженные изображения' })
  findAll(@Query() dto: PaginationDto) {
    return this.media.findAll(dto);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        alt: { type: 'string' },
      },
    },
  })
  @ApiOperation({ summary: 'Загрузить изображение (webp-производные создаются сразу)' })
  // В память, а не на диск: настоящий тип проверяем по байтам ДО записи,
  // чтобы не оставлять на диске файл, который потом отвергнем.
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  upload(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: MAX_IMAGE_BYTES })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.media.upload(file, dto.alt ?? '', user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Изменить подпись (alt) изображения' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMediaDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.media.updateAlt(id, dto.alt, user);
  }

  @Delete(':id')
  @Roles(AdminRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить неиспользуемое изображение (только OWNER)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<void> {
    return this.media.remove(id, user);
  }
}
