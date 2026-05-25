import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import {
  MS_PER_DAY,
  MS_PER_SECOND,
} from '../../../common/constants/time.constants';
import { JwtConfig } from '../../../config/configuration';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { User } from '../models/entities/user.entity';

interface JwtPayloadWithIat extends JwtPayload {
  iat: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  private readonly maxAgeMs: number;

  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    const jwtConfig = configService.get<JwtConfig>('jwt');
    if (!jwtConfig?.secret) {
      throw new Error('JWT secret is missing');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // We enforce token lifetime manually so we can also revoke all tokens
      // for the user when one of them exceeds the maximum age.
      ignoreExpiration: true,
      secretOrKey: jwtConfig.secret,
    });
    this.maxAgeMs = jwtConfig.maxAgeDays * MS_PER_DAY;
  }

  async validate(payload: JwtPayloadWithIat): Promise<User> {
    if (!payload?.iat) {
      throw new UnauthorizedException('Invalid token (missing iat)');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    const issuedAtMs = payload.iat * MS_PER_SECOND;
    const now = Date.now();

    // Hard maximum lifetime: token older than maxAgeDays => revoke every
    // token of this user (set tokenInvalidatedAt = now) and reject.
    if (now - issuedAtMs > this.maxAgeMs) {
      user.tokenInvalidatedAt = new Date();
      await this.userRepository.save(user);
      this.logger.warn(
        `JWT for user ${user.id} exceeded max age (${this.maxAgeMs}ms); invalidating all tokens.`,
      );
      throw new UnauthorizedException(
        'Token has exceeded its maximum lifetime, please sign in again',
      );
    }

    // Token explicitly revoked (signout, password change, security event...)
    if (
      user.tokenInvalidatedAt &&
      issuedAtMs < user.tokenInvalidatedAt.getTime()
    ) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return user;
  }
}
