import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './entity/user.entity.js';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) { }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  create(data: Partial<User>): Promise<User> {
    const user = this.users.create(data);
    return this.users.save(user);
  }

  async findById(id: string): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    return user as User;
  }

  async findActiveSellers(): Promise<User[]> {
    const users = await this.users.find({
      where: { role: UserRole.Seller, status: UserStatus.Active }
    });
    return users
  }
}
