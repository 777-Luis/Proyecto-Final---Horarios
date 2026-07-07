import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../domain/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super_secret',
    });
  }

  async validate(payload: JwtPayload) {
    // Return user info. It gets attached to req.user.
    return { userId: payload.sub, username: payload.username, role: payload.role, isSuperAdmin: payload.isSuperAdmin };
  }
}
