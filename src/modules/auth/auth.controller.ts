import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Ip,
  UseGuards,
  Get,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { Public } from './decorators/public.decorator';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Throttle } from '@nestjs/throttler'; // Đảm bảo đã import
import { Request } from 'express'; // Đảm bảo đã import nếu cần
import { UserProfileDto } from '../users/dto/user-profile-dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 5, ttl: 60000 } }) // Áp dụng rate limit cho login
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(loginDto, ip, userAgent);
  }

  // Fix: ESLint no-base-to-string
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@GetUser() user: unknown): UserProfileDto {
    const userRecord = user as Record<string, unknown>;

    // Helper function để chuyển đổi một giá trị không xác định thành string an toàn
    const safeString = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      return ''; // Trả về chuỗi rỗng thay vì chuyển đổi đối tượng phức tạp
    };

    // Tạo đối tượng mới với kiểu dữ liệu an toàn
    const profileDto: UserProfileDto = {
      sub: safeString(userRecord.sub),
      email: safeString(userRecord.email),
      full_name: safeString(userRecord.full_name),
      role: safeString(userRecord.role),
      is_verified: Boolean(userRecord.is_verified),
    };

    return profileDto;
  }

  @Public() // Endpoint refresh token là public, chỉ cần refresh token hợp lệ
  @UseGuards(JwtRefreshGuard) // Bảo vệ bằng Refresh Guard
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @GetUser('sub') userId: string,
    @GetUser('refreshToken') refreshToken: string,
  ) {
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard) // Cần access token để chứng minh danh tính khi logout
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @GetUser('sub') userId: string,
    @Body('refreshToken') refreshToken?: string, // Refresh token của phiên hiện tại (tùy chọn)
  ) {
    return this.authService.logout(userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard) // Cần access token để chứng minh danh tính khi logout
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@GetUser('sub') userId: string) {
    return this.authService.logout(userId);
  }
}
