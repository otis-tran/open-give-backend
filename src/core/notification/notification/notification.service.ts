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

  sendEmail(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      const toList = Array.isArray(payload.to) ? payload.to.join(', ') : payload.to;
      console.log(`Sending email to ${toList}: ${payload.subject}`);
      return Promise.resolve({ success: true, id: `email-${Date.now()}` });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return Promise.resolve({ success: false, error: errMsg });
    }
  }

  sendSms(to: string, message: string): Promise<NotificationResult> {
    try {
      console.log(`Sending SMS to ${to}: ${message}`);
      return Promise.resolve({ success: true, id: `sms-${Date.now()}` });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return Promise.resolve({ success: false, error: errMsg });
    }
  }
}
