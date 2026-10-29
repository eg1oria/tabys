import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service.js';
import { LeadNotificationListener } from './lead-notification.listener.js';
import { LeadsModule } from '../leads/leads.module.js';

@Module({
  imports: [LeadsModule],
  providers: [TelegramService, LeadNotificationListener],
  exports: [TelegramService],
})
export class NotificationsModule {}
