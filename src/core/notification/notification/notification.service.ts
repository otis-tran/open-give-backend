import { Injectable } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { NotificationPayload, NotificationResult } from '../interfaces/notification.interface';

@Injectable()
export class NotificationService {
  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  async sendEmail(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      // Giả lập gửi email
      console.log(`Sending email to ${payload.to}: ${payload.subject}`);
      return { success: true, id: `email-${Date.now()}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendSms(to: string, message: string): Promise<NotificationResult> {
    try {
      // Giả lập gửi SMS
      console.log(`Sending SMS to ${to}: ${message}`);
      return { success: true, id: `sms-${Date.now()}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}