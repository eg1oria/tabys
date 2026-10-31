import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TelegramService } from './telegram.service.js';
import { SetTelegramTokenDto } from './dto/set-telegram-token.dto.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AdminRole } from '../../prisma/client.js';
import type { AuthUser } from '../../auth/types.js';

/**
 * Бота меняет только владелец: от него зависит, дойдут ли заявки вообще.
 * Свой чат подключает любой админ — менеджер делает это сам.
 */
@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/notifications/telegram')
export class AdminNotificationsController {
  constructor(private readonly telegram: TelegramService) {}

  @Get()
  @ApiOperation({ summary: 'Подключённый бот, чаты и заявки без уведомления' })
  status() {
    return this.telegram.status();
  }

  @Put('bot')
  @Roles(AdminRole.OWNER)
  @ApiOperation({ summary: 'Подключить бота по токену из @BotFather' })
  setBot(@Body() dto: SetTelegramTokenDto, @CurrentUser() user: AuthUser) {
    return this.telegram.setToken(dto.token, user);
  }

  @Delete('bot')
  @Roles(AdminRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Отключить бота вместе с чатами' })
  removeBot(@CurrentUser() user: AuthUser): Promise<void> {
    return this.telegram.removeBot(user);
  }

  @Post('link')
  @ApiOperation({ summary: 'Одноразовая ссылка для подключения чата' })
  createLink(@CurrentUser() user: AuthUser) {
    return this.telegram.createLink(user);
  }

  @Post('link/:code/check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Проверить, нажали ли «Start» по ссылке' })
  checkLink(@Param('code') code: string, @CurrentUser() user: AuthUser) {
    return this.telegram.checkLink(code, user);
  }

  @Delete('chats/:id')
  @Roles(AdminRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Отключить чат' })
  removeChat(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    return this.telegram.removeChat(id, user);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Отправить проверочное сообщение во все чаты' })
  test() {
    return this.telegram.sendTest();
  }
}
