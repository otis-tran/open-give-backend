import { Expose } from 'class-transformer';

export class UserProfileDto {
  @Expose()
  sub!: string;

  @Expose()
  email!: string;

  @Expose()
  full_name!: string;

  @Expose()
  role!: string;

  @Expose()
  is_verified!: boolean;
}
