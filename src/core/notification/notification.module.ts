import { Module } from '@nestjs/common';
import { EmailService } from './email/email.service';
import { SmsService } from './sms/sms.service';
import { NotificationService } from './notification/notification.service';
import { NotificationController } from './notification.controller';

@Module({
    controllers: [NotificationController],
  providers: [EmailService, SmsService, NotificationService],
  exports: [NotificationService]
})
export class NotificationModule {}
