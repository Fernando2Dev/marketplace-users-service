import { ConflictException, Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';
import { UserStatus } from '../users/user.entity.js';
import { PublicUser, toPublicUser } from '../users/public-user.js';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService) {}

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
