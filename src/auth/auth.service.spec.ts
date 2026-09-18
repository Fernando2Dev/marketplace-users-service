import { ConflictException } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import { User, UserRole } from '../users/user.entity.js';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';

const input: RegisterDto = {
  email: 'buyer@example.com',
  password: 'Secret123!',
  firstName: 'Ana',
  lastName: 'Silva',
  role: UserRole.Buyer,
};

function createService() {
  const users = {
    existsBy: vi.fn(),
    create: vi.fn((data: Partial<User>) => data as User),
    save: vi.fn(),
  };
  return { service: new AuthService(users as unknown as Repository<User>), users };
}

describe('AuthService', () => {
  it('retorna 409 sem tentar salvar quando o email já existe', async () => {
    const { service, users } = createService();
    users.existsBy.mockResolvedValue(true);

    await expect(service.register(input)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(users.create).not.toHaveBeenCalled();
    expect(users.save).not.toHaveBeenCalled();
  });

  it('retorna 409 quando o email é inserido por outra requisição antes do save', async () => {
    const { service, users } = createService();
    users.existsBy.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    users.save.mockRejectedValue(
      new QueryFailedError('INSERT', [], { code: '23505' }),
    );

    await expect(service.register(input)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(users.existsBy).toHaveBeenCalledTimes(2);
  });

  it('não converte outra violação única em conflito de email', async () => {
    const { service, users } = createService();
    const databaseError = new QueryFailedError('INSERT', [], { code: '23505' });
    users.existsBy.mockResolvedValue(false);
    users.save.mockRejectedValue(databaseError);

    await expect(service.register(input)).rejects.toBe(databaseError);
  });
});
