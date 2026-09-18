import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import bcryptjs from 'bcryptjs';
import { QueryFailedError } from 'typeorm';
import { User, UserStatus } from '../users/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ user: Partial<User>; token: string }> {
    const user = await this.users.findByEmail(dto.email);

    const userPassword = user
      ? await bcryptjs.compare(dto.password, user.password)
      : false;

    if (!user || !userPassword) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.status !== UserStatus.Active) {
      throw new UnauthorizedException('Conta inativa');
    }

    const token = await this.jwt.signAsync(
      {
        email: user.email,
        role: user.role,
      },
      { subject: user.id },
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };
  }

  async register(dto: RegisterDto): Promise<Partial<User>> {
    const existingUser = await this.users.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const password = await bcrypt.hash(dto.password, 10);

    let user: User;
    try {
      user = await this.users.create({
        ...dto,
        password,
        status: UserStatus.Active,
      });
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

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
