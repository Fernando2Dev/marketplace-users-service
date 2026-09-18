import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import bcryptjs from 'bcryptjs';
import { QueryFailedError } from 'typeorm';
import { UserStatus } from '../users/user.entity.js';
import { PublicUser, toPublicUser } from '../users/public-user.js';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

export type LoginResponse = { user: PublicUser; token: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !(await bcryptjs.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    if (user.status !== UserStatus.Active) {
      throw new UnauthorizedException('Conta inativa');
    }

    const token = await this.jwt.signAsync(
      { email: user.email, role: user.role },
      { subject: user.id },
    );
    return { user: toPublicUser(user), token };
  }

  async register(dto: RegisterDto): Promise<PublicUser> {
    const existingUser = await this.users.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const password = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.users.create({
        ...dto,
        password,
        status: UserStatus.Active,
      });
      return toPublicUser(user);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505' &&
        (await this.users.findByEmail(dto.email))
      ) {
        throw new ConflictException('Email já cadastrado');
      }
      throw error;
    }
  }
}
