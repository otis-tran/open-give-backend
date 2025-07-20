// src/modules/auth/repositories/auth.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { users } from 'generated/prisma';
import { HashService } from 'src/core/security/hash/hash.service';

@Injectable()
export class AuthRepository {
  private readonly logger = new Logger(AuthRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
  ) {}

  /**
   * Find user by email with complete profile
   */
  async findUserByEmail(email: string): Promise<users | null> {
    return this.prisma.users.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by ID with security fields
   */
  async findUserById(userId: string) {
    return this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        is_active: true,
        is_verified: true,
        token_version: true,
        two_factor_enabled: true,
        two_factor_secret: true,
      },
    });
  }

  /**
   * Create new user account
   */
  async createUser(userData: {
    email: string;
    password_hash: string;
    full_name: string;
    phone?: string;
    role: any;
  }) {
    return this.prisma.users.create({
      data: userData,
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        created_at: true,
        is_verified: true,
      },
    });
  }

  /**
   * Update user after successful login
   */
  async updateUserLoginSuccess(userId: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        failed_login_attempts: 0,
        last_failed_login_at: null,
        last_login_at: new Date(),
        token_version: { increment: 1 },
      },
      select: {
        id: true,
        email: true,
        role: true,
        token_version: true,
      },
    });
  }

  /**
   * Increment failed login attempts
   */
  async incrementFailedLoginAttempts(userId: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        failed_login_attempts: { increment: 1 },
        last_failed_login_at: new Date(),
      },
    });
  }

  /**
   * Save hashed refresh token securely
   */
  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    await this.prisma.refresh_tokens.create({
      data: {
        token_hash: tokenHash,
        user_id: userId,
        expires_at: expiresAt,
      },
    });
  }

  /**
   * Find valid refresh token by comparing with stored hash
   */
  async findValidRefreshTokenByHash(userId: string, plainToken: string) {
    // Get all non-revoked tokens for the user
    const userTokens = await this.prisma.refresh_tokens.findMany({
      where: {
        user_id: userId,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
    });

    // Compare the plain token with each hashed token
    for (const storedToken of userTokens) {
      const isMatch = await this.hashService.comparePassword(plainToken, storedToken.token_hash);
      if (isMatch) {
        return storedToken;
      }
    }

    return null;
  }

  /**
   * Revoke refresh tokens (specific or all for user)
   */
  async revokeRefreshTokens(userId: string, specificTokenHash?: string) {
    const where = specificTokenHash
      ? { user_id: userId, token_hash: specificTokenHash, revoked_at: null }
      : { user_id: userId, revoked_at: null };

    await this.prisma.refresh_tokens.updateMany({
      where,
      data: { revoked_at: new Date() },
    });
  }

  /**
   * Update user's 2FA secret
   */
  async updateTwoFactorSecret(userId: string, secret: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: { two_factor_secret: secret },
    });
  }

  /**
   * Enable 2FA for user
   */
  async enableTwoFactor(userId: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: { two_factor_enabled: true },
    });
  }

  /**
   * Create login history record
   */
  async createLoginHistory(data: {
    user_id: string;
    ip_address: string;
    user_agent: string;
    success: boolean;
  }) {
    return this.prisma.user_login_history.create({ data });
  }

  /**
   * Disable 2FA for user and clear secret
   */
  async disableTwoFactor(userId: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        two_factor_enabled: false,
        two_factor_secret: null, // Clear the secret for security
      },
    });
  }

  /**
   * Get user's login history
   */
  async getLoginHistory(userId: string, limit: number = 10) {
    return this.prisma.user_login_history.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true,
        ip_address: true,
        user_agent: true,
        success: true,
        created_at: true,
      },
    });
  }
}
