import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import pool from '../database';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'unai-sponsorship-secret-2026',
    });
  }

  async validate(payload: any) {
    if (!payload.sub) throw new UnauthorizedException('Token tidak valid');
    const result = await pool.query('SELECT id_pengguna, email, peran, status_akun FROM users WHERE id_pengguna = $1', [payload.sub]);
    const user = result.rows[0];
    if (!user || user.status_akun !== 'Aktif') throw new UnauthorizedException('Akun tidak aktif');
    return { id_pengguna: user.id_pengguna, email: user.email, peran: user.peran };
  }
}
