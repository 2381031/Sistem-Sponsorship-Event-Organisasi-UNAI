import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

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
    return { id_pengguna: payload.sub, email: payload.email, peran: payload.role };
  }
}
