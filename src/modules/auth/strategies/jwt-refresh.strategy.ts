import { Injectable, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

/* --------- Định nghĩa payload của refresh-token ---------- */
interface JwtRefreshPayload {
  sub: string; // user id
  version: number; // token_version
  iat?: number;
  exp?: number;
}

/* -------- Thông tin user được validate ---------- */
interface RefreshTokenUser {
  sub: string;
  version: number;
  refreshToken: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  private readonly logger = new Logger(JwtRefreshStrategy.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    // Get refresh secret with fallback
    const refreshSecret =
      configService.get<string>('auth.jwt.refreshSecret') ||
      configService.get<string>('JWT_REFRESH_SECRET') ||
      process.env.JWT_REFRESH_SECRET ||
      'refreshSecretKey456'; // fallback

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: refreshSecret, // ← Now guaranteed to be string
      passReqToCallback: true, // ← This is correct for WithRequest type
    });

    this.logger.debug(
      `JWT Refresh Strategy initialized with secret: ${refreshSecret ? '***SET***' : 'NOT_SET'}`,
    );
  }

  /**
   * Validate refresh token and extract user information
   * @param req - Express request object
   * @param payload - JWT payload from refresh token
   * @returns User data with refresh token
   */
  async validate(req: Request, payload: JwtRefreshPayload): Promise<RefreshTokenUser> {
    this.logger.debug('🔄 Refresh Token Validation Started');
    this.logger.debug(
      `Payload: ${JSON.stringify(
        {
          sub: payload.sub,
          version: payload.version,
          iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : undefined,
          exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
        },
        null,
        2,
      )}`,
    );

    // Extract refresh token from Authorization header
    const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim();

    if (!refreshToken) {
      this.logger.warn('Refresh token validation failed: No token provided');
      throw new UnauthorizedException('Refresh token không được cung cấp');
    }

    if (!payload.sub) {
      this.logger.warn('Refresh token validation failed: Missing user ID');
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    // Verify user exists and is active
    const user = await this.prisma.users.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        token_version: true,
        is_active: true,
      },
    });

    if (!user || !user.is_active) {
      this.logger.warn(
        `Refresh token validation failed: User not found or inactive - ${payload.sub}`,
      );
      throw new UnauthorizedException('Người dùng không tồn tại hoặc đã bị vô hiệu hóa');
    }

    // Validate token version
    if (user.token_version !== payload.version) {
      this.logger.warn(
        `Refresh token validation failed: Token version mismatch - User: ${payload.sub}, Expected: ${user.token_version}, Got: ${payload.version}`,
      );
      throw new UnauthorizedException('Refresh token không còn hợp lệ');
    }

    this.logger.debug(`Refresh token validation successful for user: ${payload.sub}`);

    return {
      sub: payload.sub,
      version: payload.version,
      refreshToken,
    };
  }
}
