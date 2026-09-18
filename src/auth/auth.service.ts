import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { QueryFailedError, Repository } from 'typeorm';
import { User, UserStatus } from '../users/user.entity.js';
import { RegisterDto } from './dto/register.dto.js';

export type RegisterResponse = Pick<
  User,
  | 'id'
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'role'
  | 'status'
  | 'createdAt'
  | 'updatedAt'
>;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async register(input: RegisterDto): Promise<RegisterResponse> {
    if (await this.users.existsBy({ email: input.email })) {
      throw new ConflictException('Email já cadastrado');
    }

    const user = this.users.create({
      email: input.email,
      password: await bcrypt.hash(input.password, 10),
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      status: UserStatus.Active,
    });

    let saved: User;
    try {
      saved = await this.users.save(user);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505' &&
        (await this.users.existsBy({ email: input.email }))
      ) {
        throw new ConflictException('Email já cadastrado');
      }
      throw error;
    }

    return {
      id: saved.id,
      email: saved.email,
      firstName: saved.firstName,
      lastName: saved.lastName,
      role: saved.role,
      status: saved.status,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }
}
