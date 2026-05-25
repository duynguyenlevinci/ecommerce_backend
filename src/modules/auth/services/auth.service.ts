import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { BcryptConfig } from '../../../config/configuration';
import { AUTH } from '../constants/auth.constants';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { SigninDto } from '../models/dto/signin.dto';
import { SignupDto } from '../models/dto/signup.dto';
import { User } from '../models/entities/user.entity';

export interface AuthResponse {
  accessToken: string;
  tokenType: typeof AUTH.TOKEN_TYPE_BEARER;
  expiresIn: string;
  user: Omit<User, 'password' | 'orders' | 'tokenInvalidatedAt'>;
}

@Injectable()
export class AuthService {
  private readonly saltRounds: number;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const bcryptConfig = this.configService.get<BcryptConfig>('bcrypt');
    this.saltRounds = bcryptConfig?.saltRounds ?? AUTH.DEFAULT_BCRYPT_SALT_ROUNDS;
  }

  async signup(dto: SignupDto): Promise<AuthResponse> {
    const exists = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException(`Email "${dto.email}" is already registered`);
    }

    const hashed = await bcrypt.hash(dto.password, this.saltRounds);
    const user = this.userRepository.create({
      email: dto.email,
      password: hashed,
      fullName: dto.fullName,
      phone: dto.phone ?? null,
    });
    const saved = await this.userRepository.save(user);
    return this.buildResponse(saved);
  }

  async signin(dto: SigninDto): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }
    return this.buildResponse(user);
  }

  /**
   * Revoke EVERY active token of the user by bumping `tokenInvalidatedAt`.
   * Any JWT issued before this moment will be rejected by the JwtStrategy.
   */
  async logout(user: User): Promise<void> {
    user.tokenInvalidatedAt = new Date();
    await this.userRepository.save(user);
  }

  private buildResponse(user: User): AuthResponse {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);
    const {
      password: _pw,
      orders: _orders,
      tokenInvalidatedAt: _tia,
      ...safe
    } = user;
    return {
      accessToken,
      tokenType: AUTH.TOKEN_TYPE_BEARER,
      expiresIn:
        this.configService.get<string>('jwt.expiresIn') ??
        AUTH.DEFAULT_JWT_EXPIRES_IN,
      user: safe,
    };
  }
}
