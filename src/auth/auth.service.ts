import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) { }

  async register(dto: RegisterDto): Promise<User> {

    const existingUser = await this.users.findBy({ email: dto.email })

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const hasPassword = await bcrypt.hash(dto.password, 10)

    const user = this.users.create({
      ...dto,
      password: hasPassword
    });

    const userSave = await this.users.save(user)

    return userSave
  }
}
