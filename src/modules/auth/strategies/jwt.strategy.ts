import { Injectable, UnauthorizedException, Inject, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { user_role } from 'generated/prisma';

/* ---------- 1. Định nghĩa payload của access-token ---------- */
interface JwtAccessPayload {
  sub: string;
  email: string;
  role: user_role;
  version: number;
  iat?: number;
  exp?: number;
}

/* -------- 2. Thông tin user sẽ gán vào request.user ---------- */
interface AuthenticatedUser {
  sub: string;
  email: string;
  full_name: string;
  role: user_role;
  is_verified: boolean | null;
  token_version: number | null;
}

/* -------- 3. Cached user data structure ---------- */
interface CachedUser {
  id: string;
  email: string;
  full_name: string;
  role: user_role;
  is_active: boolean | null;
  is_verified: boolean | null;
  token_version: number | null;
  cached_at: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  private readonly cacheTTL = 300000; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    // Ensure secret is never undefined
    const accessSecret =
      configService.get<string>('auth.jwt.accessSecret') ||
      configService.get<string>('JWT_ACCESS_SECRET') ||
      process.env.JWT_ACCESS_SECRET ||
      'defaultAccessSecret123';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: accessSecret,
    });

    // Validate configuration
    if (!configService.get('auth.jwt.accessSecret') && !process.env.JWT_ACCESS_SECRET) {
      this.logger.warn('⚠️  JWT Access Secret not configured properly! Using fallback.');
    }

    this.logger.debug(`JWT Strategy initialized successfully`);
  }

  /**
   * Validate JWT payload with Redis caching and security checks
   */
  async validate(payload: JwtAccessPayload): Promise<AuthenticatedUser> {
    this.logger.debug('🔐 JWT Token Validation Started');
    this.logger.debug(`Validating token for user: ${payload.sub}, version: ${payload.version}`);

    if (!payload.sub) {
      this.logger.warn('JWT validation failed: Missing user ID in payload');
      throw new UnauthorizedException('Invalid token payload');
    }

    // Get user with caching
    const user = await this.getUserWithCache(payload.sub);

    if (!user) {
      this.logger.warn(`JWT validation failed: User not found - ${payload.sub}`);
      throw new UnauthorizedException('Người dùng không tồn tại hoặc đã bị vô hiệu hóa');
    }

    // Check account status
    if (!user.is_active) {
      this.logger.warn(`JWT validation failed: Inactive user - ${payload.sub}`);
      await this.clearUserCache(payload.sub);
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }

    // Check token version
    if (user.token_version !== payload.version) {
      this.logger.warn(
        `JWT validation failed: Token version mismatch - User: ${payload.sub}, Expected: ${user.token_version}, Got: ${payload.version}`,
      );
      await this.clearUserCache(payload.sub);
      throw new UnauthorizedException('Token không còn hợp lệ, vui lòng đăng nhập lại');
    }

    this.logger.debug(`JWT validation successful for user: ${payload.sub}`);

    return {
      sub: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_verified: user.is_verified,
      token_version: user.token_version,
    };
  }

  // ==================== PRIVATE METHODS ====================

  private async getUserWithCache(userId: string): Promise<CachedUser | null> {
    const cacheKey = `user:${userId}`;

    try {
      // Try cache first
      const cachedUser = await this.cacheManager.get<CachedUser>(cacheKey);

      if (cachedUser && this.isCacheValid(cachedUser)) {
        this.logger.debug(`Cache hit for user: ${userId}`);
        return cachedUser;
      }

      this.logger.debug(`Cache miss for user: ${userId}, fetching from database`);

      // Fetch from database
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true,
          is_active: true,
          is_verified: true,
          token_version: true,
        },
      });

      if (!user) {
        return null;
      }

      // Cache the user
      const userToCache: CachedUser = {
        ...user,
        cached_at: Date.now(),
      };

      await this.cacheManager.set(cacheKey, userToCache, this.cacheTTL);
      this.logger.debug(`User cached successfully: ${userId}`);

      return userToCache;
    } catch (error) {
      this.logger.error(`Error fetching user ${userId}:`, error);

      // Fallback to direct DB query
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true,
          is_active: true,
          is_verified: true,
          token_version: true,
        },
      });

      return user ? { ...user, cached_at: Date.now() } : null;
    }
  }

  private isCacheValid(cachedUser: CachedUser): boolean {
    const now = Date.now();
    const cacheAge = now - cachedUser.cached_at;
    return cacheAge < this.cacheTTL;
  }

  private async clearUserCache(userId: string): Promise<void> {
    try {
      await this.cacheManager.del(`user:${userId}`);
      this.logger.debug(`Cache cleared for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error clearing cache for user ${userId}:`, error);
    }
  }

  /**
   * Public method to invalidate user cache
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await this.clearUserCache(userId);
  }
}
