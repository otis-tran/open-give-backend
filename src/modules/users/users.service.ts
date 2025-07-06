import { Injectable } from '@nestjs/common';
import { NotificationService } from 'src/core/notification/notification/notification.service';

@Injectable()
export class UsersService {
  constructor(private readonly notificationService: NotificationService) {}

  async createUser(userData: any) {
    // Logic tạo người dùng...
    
    // Sử dụng shared notification service
    await this.notificationService.sendEmail({
      to: userData.email,
      subject: 'Welcome to our platform!',
      content: `Hi ${userData.name}, your account has been created successfully.`
    });
    
    return { id: 1, ...userData };
  }
  
  async resetPassword(email: string) {
    // Logic reset mật khẩu...
    
    // Sử dụng shared notification service
    await this.notificationService.sendEmail({
      to: email,
      subject: 'Password Reset',
      content: 'Here is your password reset link...'
    });
    
    return { success: true };
  }
}