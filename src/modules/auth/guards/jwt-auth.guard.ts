import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return isPublic ? true : super.canActivate(context);
  }

  /* ------------------------------------------------------------------ */
  /*                  CHỈ SỬA 3 THAM SỐ BẮT BUỘC CỦA PASSPORT           */
  /* ------------------------------------------------------------------ */
  handleRequest<TUser = unknown>(
    err: Error | null | undefined,
    user: unknown, // không dùng any
    info: unknown, // không dùng any
  ): TUser {
    if (err || !user) {
      // ép kiểu info trước khi đọc .name  -> hết “unsafe-member-access”
      const tokenInfo = info as { name?: string };
      if (tokenInfo?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token đã hết hạn, vui lòng đăng nhập lại');
      }
      throw err ?? new UnauthorizedException('Không có quyền truy cập');
    }

    // ép kiểu khi trả về  -> hết “unsafe-return”
    return user as TUser;
  }
}
