import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator.js';
import { PublicCache } from '../../common/http/cache-control.js';
import { ContactsService, type Contacts } from './contacts.service.js';

@ApiTags('public')
@Public()
@PublicCache()
@Controller('public/contacts')
export class PublicContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'Адрес, телефоны, почта и соцсети компании' })
  get(): Promise<Contacts> {
    return this.contacts.get();
  }
}
