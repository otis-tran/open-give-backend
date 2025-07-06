import { Controller, Post, Body } from '@nestjs/common';
import { NotificationService } from './notification/notification.service';
import { NotificationPayload } from './interfaces/notification.interface';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('email')
  sendEmail(@Body() payload: NotificationPayload) {
    return this.notificationService.sendEmail(payload);
  }

  @Post('sms')
  sendSms(@Body() body: { to: string; message: string }) {
    return this.notificationService.sendSms(body.to, body.message);
  }
}