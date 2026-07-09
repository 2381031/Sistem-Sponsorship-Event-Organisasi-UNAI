import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../users/user.service.js';
import { LoginUserDto } from './dto/login-user.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(loginUserDto: LoginUserDto) {
    const user = await this.userService.findByEmail(loginUserDto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatches = await bcrypt.compare(loginUserDto.password, user.password);
    if (!passwordMatches) throw new UnauthorizedException('Invalid credentials');

    if (user.status_akun === 'pending') {
      throw new UnauthorizedException('Akun belum terverifikasi');
    }
    if (user.status_akun === 'rejected') {
      throw new UnauthorizedException('Akun ditolak oleh administrator');
    }

    return user;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.peran };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nama_lengkap: user.nama_lengkap,
        peran: user.peran,
        status_akun: user.status_akun,
        organisasiDetails: user.organisasiDetails,
        sponsorDetails: user.sponsorDetails,
      },
    };
  }
}
