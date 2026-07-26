import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcryptjs from 'bcryptjs';
import { UserService } from '../users/user.service';
import { LoginUserDto } from './dto/login-user.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import pool from '../database';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email sudah terdaftar');

    const user = await this.userService.create(dto);
    return {
      message: 'Pendaftaran berhasil! Menunggu verifikasi admin.',
      user: { id: user.id_pengguna, email: user.email, peran: user.peran, status_akun: user.status_akun },
    };
  }

  async login(dto: LoginUserDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Email atau password salah');

    const passwordMatches = await bcryptjs.compare(dto.password, user.kata_sandi);
    if (!passwordMatches) throw new UnauthorizedException('Email atau password salah');

    if (user.status_akun === 'Menunggu Verifikasi')
      throw new UnauthorizedException('Akun belum terverifikasi');

    if (user.status_akun === 'Ditolak')
      throw new UnauthorizedException('Akun ditolak oleh administrator');

    const payload = { sub: user.id_pengguna, email: user.email, role: user.peran };
    const accessToken = this.jwtService.sign(payload);

    let profilDetail: any = null;
    if (user.peran === 'organisasi') {
      const r = await pool.query('SELECT * FROM organisasi WHERE id_pengguna = $1', [user.id_pengguna]);
      if (r.rows[0]) profilDetail = r.rows[0];
    } else if (user.peran === 'sponsor') {
      const r = await pool.query('SELECT * FROM sponsor WHERE id_pengguna = $1', [user.id_pengguna]);
      if (r.rows[0]) profilDetail = r.rows[0];
    }

    return {
      accessToken,
      user: {
        id: user.id_pengguna,
        email: user.email,
        peran: user.peran,
        status_akun: user.status_akun,
        profil: profilDetail,
      },
    };
  }
}
