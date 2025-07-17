import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { User } from '../../users/entities/user.entity'; // Đảm bảo import User entity nếu nó định nghĩa cấu trúc user

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): unknown => {
    // Đã sửa: bỏ `User` khỏi union
    const request = ctx.switchToHttp().getRequest<Request & { user: User }>();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
