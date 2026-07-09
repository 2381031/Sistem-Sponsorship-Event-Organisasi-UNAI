import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { UserService } from '../users/user.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(@Body() createUserDto: CreateUserDto) {
    const password = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.userService.create({
      ...createUserDto,
      password,
      status_akun: 'pending',
    });
    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        peran: user.peran,
        status_akun: user.status_akun,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(new ValidationPipe({ whitelist: true })) loginUserDto: LoginUserDto) {
    const user = await this.authService.validateUser(loginUserDto);
    return this.authService.login(user);
  }
}
