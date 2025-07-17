import { user_role } from 'generated/prisma';

export interface JwtPayload {
  sub: string;
  email?: string;
  role?: user_role;
  version?: number;
  iat: number;
  exp: number;
  [key: string]: unknown;
}
