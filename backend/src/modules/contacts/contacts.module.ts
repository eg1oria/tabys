import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service.js';
import { PublicContactsController } from './public-contacts.controller.js';
import { AdminContactsController } from './admin-contacts.controller.js';

@Module({
  controllers: [PublicContactsController, AdminContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
