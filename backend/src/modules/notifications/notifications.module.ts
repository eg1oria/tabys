import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service.js';
import { LeadNotifier } from './lead-notifier.service.js';
import { LeadNotificationListener } from './lead-notification.listener.js';
import { AdminNotificationsController } from './admin-notifications.controller.js';
import { OpsAlerts } from './ops-alerts.service.js';

@Module({
  controllers: [AdminNotificationsController],
  providers: [
    TelegramService,
    LeadNotifier,
    LeadNotificationListener,
    OpsAlerts,
  ],
  exports: [TelegramService, LeadNotifier],
})
export class NotificationsModule {}
