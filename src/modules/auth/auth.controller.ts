// src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Get,
  UseGuards,
  Logger,
  Ip,
  Headers,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { plainToInstance } from 'class-transformer';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GetUser } from './decorators/get-user.decorator';
import { Public } from './decorators/public.decorator';
import { UserProfileDto } from '../users/dto/user-profile-dto';
import { TwoFactorVerifyDto } from './dto/two-factor.dto';

// Response DTOs for Swagger documentation
class LoginResponseDto {
  message: string;
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_verified: boolean;
  };
}

class TwoFactorRequiredDto {
  requiresTwoFactor: boolean;
}

class TwoFactorSetupResponseDto {
  secret: string;
  qrCodeUrl: string;
}

class RefreshTokensResponseDto {
  access_token: string;
  refresh_token: string;
}

class LogoutResponseDto {
  message: string;
}

interface AuthenticatedUser {
  sub: string;
  email: string;
  full_name: string;
  role: string;
  is_verified: boolean;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Register new user account with password confirmation
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user',
    description:
      'Create a new user account with email, password confirmation, and profile information',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed - passwords do not match or invalid data',
  })
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log(`Registration request for: ${registerDto.email}`);
    return this.authService.register(registerDto);
  }

  /**
   * Login user with optional 2FA support
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticate user with email/password and optional 2FA code',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: '2FA required',
    type: TwoFactorRequiredDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or 2FA code',
  })
  @ApiResponse({
    status: 403,
    description: 'Account locked or disabled',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many login attempts',
  })
  @ApiQuery({
    name: 'twoFactorCode',
    required: false,
    description: '6-digit TOTP code from authenticator app',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Query('twoFactorCode') twoFactorCode?: string,
  ) {
    this.logger.log(`Login attempt for: ${loginDto.email} from IP: ${ip}`);
    return this.authService.login(loginDto, ip, userAgent || '', twoFactorCode);
  }

  /**
   * Get current user profile information
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve current authenticated user profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired access token',
  })
  getProfile(@GetUser() user: AuthenticatedUser): UserProfileDto {
    this.logger.debug(`Profile request for user: ${user.email}`);

    // Use class-transformer for safe and proper mapping
    return plainToInstance(UserProfileDto, user, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Refresh authentication tokens
   */
  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Refresh tokens',
    description: 'Generate new access and refresh tokens using valid refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
    type: RefreshTokensResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  @ApiResponse({
    status: 403,
    description: 'User account disabled or token version mismatch',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer {refresh_token}',
    required: true,
  })
  async refreshTokens(
    @GetUser('sub') userId: string,
    @GetUser('refreshToken') refreshToken: string,
  ) {
    this.logger.log(`Token refresh request for user: ${userId}`);
    return this.authService.refreshTokens(userId, refreshToken);
  }

  /**
   * Setup 2FA for current user
   */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Setup 2FA',
    description: 'Generate 2FA secret and QR code for Google Authenticator setup',
  })
  @ApiResponse({
    status: 200,
    description: '2FA setup initiated - scan QR code with authenticator app',
    type: TwoFactorSetupResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  async setupTwoFactor(@GetUser('sub') userId: string) {
    this.logger.log(`2FA setup initiated for user: ${userId}`);
    return this.authService.setupTwoFactor(userId);
  }

  /**
   * Enable 2FA after verification
   */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Enable 2FA',
    description: 'Enable 2FA after verifying with TOTP code',
  })
  @ApiResponse({
    status: 200,
    description: '2FA enabled successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid TOTP code or authentication required',
  })
  @ApiBody({ type: TwoFactorVerifyDto })
  async enableTwoFactor(@GetUser('sub') userId: string, @Body() twoFactorDto: TwoFactorVerifyDto) {
    this.logger.log(`2FA enable request for user: ${userId}`);
    return this.authService.enableTwoFactor(userId, twoFactorDto.code);
  }

  /**
   * Disable 2FA for current user
   */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Disable 2FA',
    description: 'Disable 2FA after verifying with current TOTP code',
  })
  @ApiResponse({
    status: 200,
    description: '2FA disabled successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid TOTP code or authentication required',
  })
  @ApiBody({ type: TwoFactorVerifyDto })
  async disableTwoFactor(@GetUser('sub') userId: string, @Body() twoFactorDto: TwoFactorVerifyDto) {
    this.logger.log(`2FA disable request for user: ${userId}`);
    return this.authService.disableTwoFactor(userId, twoFactorDto.code);
  }

  /**
   * Logout from current device
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout current device',
    description: 'Logout from current device by revoking specific refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully from current device',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          description: 'Refresh token to revoke (optional)',
        },
      },
    },
    required: false,
  })
  async logout(@GetUser('sub') userId: string, @Body('refreshToken') refreshToken?: string) {
    this.logger.log(`Logout request for user: ${userId}`);
    return this.authService.logout(userId, refreshToken);
  }

  /**
   * Logout from all devices
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout all devices',
    description: 'Logout from all devices by revoking all refresh tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully from all devices',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  async logoutAll(@GetUser('sub') userId: string) {
    this.logger.log(`Logout all devices request for user: ${userId}`);
    return this.authService.logout(userId);
  }

  /**
   * Get user's login history
   */
  @UseGuards(JwtAuthGuard)
  @Get('login-history')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get login history',
    description: 'Retrieve recent login attempts for security monitoring',
  })
  @ApiResponse({
    status: 200,
    description: 'Login history retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of records to return (default: 10, max: 50)',
    type: Number,
  })
  async getLoginHistory(@GetUser('sub') userId: string, @Query('limit') limit = 10) {
    this.logger.debug(`Login history request for user: ${userId}`);
    const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 50);
    return this.authService.getLoginHistory(userId, safeLimit);
  }
}
