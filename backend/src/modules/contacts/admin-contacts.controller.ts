import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../auth/types.js';
import { ContactsService, type Contacts } from './contacts.service.js';
import { UpdateContactsDto } from './dto/update-contacts.dto.js';

/** Контакты правит любой админ, как и каталог; каждая правка — в журнале. */
@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/contacts')
export class AdminContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'Контакты компании' })
  get(): Promise<Contacts> {
    return this.contacts.get();
  }

  @Put()
  @ApiOperation({ summary: 'Сохранить контакты компании' })
  update(
    @Body() dto: UpdateContactsDto,
    @CurrentUser() user: AuthUser,
  ): Promise<Contacts> {
    return this.contacts.update(dto, user);
  }
}
