// src/modules/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

import { HashService } from '../../core/security/hash/hash.service';
import { AuthRepository } from './repositories/auth.repository';
import { TwoFactorService } from './services/two-factor.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { user_role } from 'generated/prisma';

interface AuthSecurityConfig {
  maxFailedAttempts: number;
  lockoutDuration: number;
}

interface AuthJwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiration: string;
  refreshExpiration: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly maxFailedAttempts: number;
  private readonly lockoutDurationMinutes: number;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly twoFactorService: TwoFactorService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    // Load security config from ConfigService
    const securityConfig = this.configService.get<AuthSecurityConfig>('auth.security');
    this.maxFailedAttempts = securityConfig?.maxFailedAttempts ?? 5;
    this.lockoutDurationMinutes = securityConfig?.lockoutDuration ?? 30;
  }

  /**
   * Register new user with password confirmation validation
   * @param registerDto - Registration data with confirmed password
   * @returns Created user information
   */
  async register(registerDto: RegisterDto) {
    this.logger.log(`Registration attempt for email: ${registerDto.email}`);

    // Additional check (though DTO already validated)
    if (registerDto.password !== registerDto.confirmPassword) {
      this.logger.warn(`Registration failed - password mismatch for email: ${registerDto.email}`);
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    }

    // Check if email already exists
    const existingUser = await this.authRepository.findUserByEmail(registerDto.email);
    if (existingUser) {
      this.logger.warn(`Registration failed - email already exists: ${registerDto.email}`);
      throw new ConflictException('Email đã được sử dụng');
    }

    // Hash password securely
    const hashedPassword = await this.hashService.hashPassword(registerDto.password);

    // Create new user
    const newUser = await this.authRepository.createUser({
      email: registerDto.email,
      password_hash: hashedPassword,
      full_name: registerDto.full_name,
      phone: registerDto.phone,
      role: registerDto.role,
    });

    this.logger.log(`User registered successfully: ${newUser.id}`);

    return {
      message: 'Đăng ký thành công',
      user: newUser,
    };
  }

  /**
   * Login user with security measures and optional 2FA
   * @param loginDto - Login credentials
   * @param ipAddress - Client IP address
   * @param userAgent - Client user agent
   * @param twoFactorCode - Optional 2FA code
   * @returns Authentication tokens and user info
   */
  async login(loginDto: LoginDto, ipAddress: string, userAgent: string, twoFactorCode?: string) {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);

    // Find user by email
    const user = await this.authRepository.findUserByEmail(loginDto.email);
    if (!user) {
      this.logger.warn(`Login failed - user not found: ${loginDto.email}`);
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    // Check account lockout
    await this.checkAccountLockout(user, ipAddress, userAgent);

    // Check if account is active
    if (user.is_active === false) {
      this.logger.warn(`Login failed - account inactive: ${user.id}`);
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa');
    }

    // Verify password
    const isPasswordValid = await this.hashService.comparePassword(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id, ipAddress, userAgent);
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    // Check 2FA if enabled
    if (user.two_factor_enabled && user.two_factor_secret) {
      if (!twoFactorCode) {
        this.logger.log(`2FA required for user: ${user.id}`);
        return { requiresTwoFactor: true };
      }

      const isValidCode = this.twoFactorService.verifyTwoFactorCode(
        user.two_factor_secret,
        twoFactorCode,
      );

      if (!isValidCode) {
        this.logger.warn(`Invalid 2FA code for user: ${user.id}`);
        throw new UnauthorizedException('Mã 2FA không hợp lệ');
      }
    }

    // Login successful - update user and generate tokens
    const updatedUser = await this.authRepository.updateUserLoginSuccess(user.id);
    const tokens = await this.generateSecureTokens(updatedUser);

    // Hash and save refresh token securely
    const refreshTokenHash = await this.hashService.hashPassword(tokens.refresh_token);
    const expiresAt = this.calculateRefreshTokenExpiry();

    await this.authRepository.saveRefreshToken(user.id, refreshTokenHash, expiresAt);

    // Log successful login
    await this.logLoginAttempt(user.id, ipAddress, userAgent, true);

    // Clear any cached user data to force refresh
    await this.cacheManager.del(`user:${user.id}`);

    this.logger.log(`Login successful for user: ${user.id}`);

    return {
      message: 'Đăng nhập thành công',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: user.full_name,
        role: updatedUser.role,
        is_verified: user.is_verified,
      },
    };
  }

  /**
   * Refresh authentication tokens
   * @param userId - User ID from JWT payload
   * @param refreshToken - Current refresh token
   * @returns New access and refresh tokens
   */
  async refreshTokens(userId: string, refreshToken: string) {
    this.logger.log(`Token refresh attempt for user: ${userId}`);

    // Find user and validate status
    const user = await this.authRepository.findUserById(userId);
    if (!user || !user.is_active) {
      this.logger.warn(`Token refresh failed - invalid user: ${userId}`);
      throw new ForbiddenException('Truy cập bị từ chối');
    }

    // Find valid refresh token by comparing hashes
    const storedRefreshToken = await this.authRepository.findValidRefreshTokenByHash(
      userId,
      refreshToken, // Pass original token for bcrypt comparison
    );

    if (!storedRefreshToken) {
      this.logger.warn(`Invalid refresh token for user: ${userId}`);
      throw new ForbiddenException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    // Generate new tokens
    const tokens = await this.generateSecureTokens({
      id: user.id,
      email: user.email,
      role: user.role,
      token_version: user.token_version || 0,
    });

    // Revoke old refresh token and save new one
    await this.authRepository.revokeRefreshTokens(userId, storedRefreshToken.token_hash);

    const newRefreshTokenHash = await this.hashService.hashPassword(tokens.refresh_token);
    const expiresAt = this.calculateRefreshTokenExpiry();

    await this.authRepository.saveRefreshToken(userId, newRefreshTokenHash, expiresAt);

    // Clear cached user data
    await this.cacheManager.del(`user:${userId}`);

    this.logger.log(`Tokens refreshed successfully for user: ${userId}`);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };
  }

  /**
   * Setup 2FA for user
   * @param userId - User ID
   * @returns 2FA secret and QR code
   */
  async setupTwoFactor(userId: string) {
    this.logger.log(`2FA setup initiated for user: ${userId}`);

    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { secret, qrCodeUrl } = this.twoFactorService.generateTwoFactorSecret(user.email);

    await this.authRepository.updateTwoFactorSecret(userId, secret);

    this.logger.log(`2FA secret generated for user: ${userId}`);

    return {
      secret,
      qrCodeUrl: await qrCodeUrl,
    };
  }

  /**
   * Enable 2FA after verification
   * @param userId - User ID
   * @param code - TOTP code for verification
   */
  async enableTwoFactor(userId: string, code: string) {
    const user = await this.authRepository.findUserById(userId);
    if (!user || !user.two_factor_secret) {
      throw new UnauthorizedException('2FA setup required first');
    }

    const isValidCode = this.twoFactorService.verifyTwoFactorCode(user.two_factor_secret, code);
    if (!isValidCode) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    await this.authRepository.enableTwoFactor(userId);
    this.logger.log(`2FA enabled for user: ${userId}`);

    return { message: '2FA đã được kích hoạt thành công' };
  }

  /**
   * Logout user from current or all devices
   * @param userId - User ID
   * @param refreshToken - Optional specific refresh token to revoke
   */
  async logout(userId: string, refreshToken?: string) {
    this.logger.log(`Logout initiated for user: ${userId}`);

    if (refreshToken) {
      // Logout from current device only
      const tokenHash = await this.hashService.hashPassword(refreshToken);
      await this.authRepository.revokeRefreshTokens(userId, tokenHash);

      this.logger.log(`Single device logout for user: ${userId}`);
      return { message: 'Đăng xuất thành công khỏi thiết bị hiện tại' };
    }

    // Logout from all devices
    await this.authRepository.revokeRefreshTokens(userId);

    // Clear cached user data
    await this.cacheManager.del(`user:${userId}`);

    this.logger.log(`All devices logout for user: ${userId}`);
    return { message: 'Đăng xuất thành công khỏi tất cả thiết bị' };
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Check if account is locked due to failed login attempts
   */
  private async checkAccountLockout(
    user: {
      id: string;
      failed_login_attempts: number | null;
      last_failed_login_at: Date | null;
    },
    ipAddress: string,
    userAgent: string,
  ) {
    if (
      (user?.failed_login_attempts ?? 0) >= this.maxFailedAttempts &&
      user?.last_failed_login_at
    ) {
      const lockoutTime = new Date(user.last_failed_login_at);
      lockoutTime.setMinutes(lockoutTime.getMinutes() + this.lockoutDurationMinutes);

      if (new Date() < lockoutTime) {
        const minutesLeft = Math.ceil((lockoutTime.getTime() - new Date().getTime()) / 60000);

        await this.logLoginAttempt(user.id, ipAddress, userAgent, false);

        this.logger.warn(`Account locked for user: ${user.id}, ${minutesLeft} minutes remaining`);

        throw new ForbiddenException(
          `Tài khoản tạm thời bị khóa do nhiều lần đăng nhập sai. Vui lòng thử lại sau ${minutesLeft} phút.`,
        );
      }
    }
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(userId: string, ipAddress: string, userAgent: string) {
    await this.authRepository.incrementFailedLoginAttempts(userId);
    await this.logLoginAttempt(userId, ipAddress, userAgent, false);

    this.logger.warn(`Failed login attempt for user: ${userId} from IP: ${ipAddress}`);
  }

  /**
   * Generate secure JWT tokens using ConfigService
   */
  private async generateSecureTokens(user: {
    id: string;
    email: string;
    role: user_role;
    token_version: number | null;
  }) {
    const jwtConfig = this.configService.get<AuthJwtConfig>('auth.jwt');

    // Debug logging
    console.log('Full auth config:', this.configService.get('auth'));

    // Add validation for the configuration
    if (!jwtConfig?.accessSecret || !jwtConfig?.refreshSecret) {
      this.logger.error('JWT configuration is missing or incomplete');
      throw new Error('JWT configuration is missing or incomplete');
    }

    const now = Math.floor(Date.now() / 1000);

    this.logger.debug(`Generating tokens for user: ${user.id}, version: ${user.token_version}`);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          version: user.token_version,
          iat: now,
        },
        {
          secret: jwtConfig.accessSecret,
          expiresIn: jwtConfig.accessExpiration,
        },
      ),
      this.jwtService.signAsync(
        {
          sub: user.id,
          version: user.token_version,
          iat: now,
        },
        {
          secret: jwtConfig.refreshSecret,
          expiresIn: jwtConfig.refreshExpiration,
        },
      ),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  /**
   * Calculate refresh token expiry date
   */
  private calculateRefreshTokenExpiry(): Date {
    const expiresAt = new Date();
    const refreshExpirationDays =
      this.configService.get<number>('auth.jwt.refreshExpirationDays') ?? 7;
    expiresAt.setDate(expiresAt.getDate() + refreshExpirationDays);
    return expiresAt;
  }

  /**
   * Log login attempt for security auditing
   */
  private async logLoginAttempt(
    userId: string,
    ipAddress: string | null,
    userAgent: string | null,
    success: boolean,
  ) {
    try {
      await this.authRepository.createLoginHistory({
        user_id: userId,
        ip_address: ipAddress || 'unknown',
        user_agent: userAgent || 'unknown',
        success,
      });
    } catch (error) {
      // Don't fail the login process due to logging errors
      this.logger.error(`Failed to log login attempt for user ${userId}:`, error);
    }
  }

  /**
   * Disable 2FA for user after verification
   * @param userId - User ID
   * @param code - TOTP code for verification
   */
  async disableTwoFactor(userId: string, code: string) {
    this.logger.log(`2FA disable initiated for user: ${userId}`);

    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.two_factor_enabled || !user.two_factor_secret) {
      throw new UnauthorizedException('2FA is not enabled for this account');
    }

    // Verify current 2FA code before disabling
    const isValidCode = this.twoFactorService.verifyTwoFactorCode(user.two_factor_secret, code);
    if (!isValidCode) {
      this.logger.warn(`Invalid 2FA code during disable attempt for user: ${userId}`);
      throw new UnauthorizedException('Invalid 2FA code');
    }

    // Disable 2FA and clear secret
    await this.authRepository.disableTwoFactor(userId);

    // Clear cached user data to force refresh
    await this.cacheManager.del(`user:${userId}`);

    this.logger.log(`2FA disabled successfully for user: ${userId}`);

    return { message: '2FA đã được tắt thành công' };
  }

  /**
   * Get user's login history for security monitoring
   * @param userId - User ID
   * @param limit - Number of records to return
   * @returns Array of login history records
   */
  async getLoginHistory(userId: string, limit: number = 10) {
    this.logger.debug(`Login history requested for user: ${userId}, limit: ${limit}`);

    // Validate user exists
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Get login history from repository
    const loginHistory = await this.authRepository.getLoginHistory(userId, limit);

    this.logger.debug(`Retrieved ${loginHistory.length} login history records for user: ${userId}`);

    return {
      message: 'Login history retrieved successfully',
      data: loginHistory,
      total: loginHistory.length,
    };
  }
}
