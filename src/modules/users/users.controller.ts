import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Post('reset-password')
  reset(@Body('email') email: string) {
    return this.usersService.resetPassword(email);
  }
  @Get()
  findAll() {
    return "Hello World";
  }
}
