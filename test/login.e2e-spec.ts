import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { User, UserRole, UserStatus } from '../src/users/user.entity.js';

process.env.NODE_ENV = 'test';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = process.env.USERS_TEST_DB_PORT ?? '5436';
process.env.DB_USERNAME = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.DB_DATABASE = 'users_test_db';
process.env.JWT_SECRET = 'login-e2e-test-secret';

const password = 'LoginPassword!42';
const secret = process.env.JWT_SECRET;
const credentials = (email: string) => ({ email, password });

describe('POST /auth/login', () => {
  let app: INestApplication;
  let users: Repository<User>;
  let jwt: JwtService;

  async function seedUser(
    role: UserRole = UserRole.Buyer,
    status: UserStatus = UserStatus.Active,
  ): Promise<User> {
    return users.save(
      users.create({
        email: `${role}-${status}@example.com`,
        password: await bcrypt.hash(password, 10),
        firstName: 'Ana',
        lastName: 'Silva',
        role,
        status,
      }),
    );
  }

  beforeAll(async () => {
    const { AppModule } = await import('../src/app.module.js');
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    users = app.get(DataSource).getRepository(User);
    jwt = app.get(JwtService);
    await users.clear();
  });

  afterEach(async () => {
    await users.clear();
  });

  afterAll(async () => {
    await app?.close();
  });

  it.each([UserRole.Buyer, UserRole.Seller])(
    'retorna usuário público e JWT válido para %s ativo',
    async (role) => {
      const user = await seedUser(role);
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(credentials(user.email))
        .expect(200);

      expect(Object.keys(response.body).sort()).toEqual(['token', 'user']);
      expect(Object.keys(response.body.user).sort()).toEqual(
        [
          'id',
          'email',
          'firstName',
          'lastName',
          'role',
          'status',
          'createdAt',
          'updatedAt',
        ].sort(),
      );
      expect(response.body.user).toEqual({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: UserStatus.Active,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      });
      expect(typeof response.body.token).toBe('string');

      const claims = jwt.verify<{
        sub: string;
        email: string;
        role: UserRole;
        iat: number;
        exp: number;
      }>(response.body.token);
      expect(claims).toMatchObject({
        sub: user.id,
        email: user.email,
        role,
      });
      expect(claims.exp - claims.iat).toBe(86_400);
      expect(() =>
        jwt.verify(response.body.token, { secret: 'different-secret' }),
      ).toThrow();
      expect(JSON.stringify(response.body)).not.toContain(password);
      expect(JSON.stringify(response.body)).not.toContain(user.password);
      expect(JSON.stringify(response.body)).not.toContain(secret);
      expect(JSON.stringify(claims)).not.toContain('password');
      expect(JSON.stringify(claims)).not.toContain(user.password);
      expect(JSON.stringify(claims)).not.toContain(secret);
    },
  );

  it('usa a mesma resposta para email inexistente e senha incorreta', async () => {
    const user = await seedUser();
    const unknown = await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials('unknown@example.com'))
      .expect(401);
    const wrong = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'WrongPassword!42' })
      .expect(401);

    expect(unknown.body).toEqual(wrong.body);
    expect(unknown.body.message).toBe('Credenciais inválidas');
    expect(unknown.body).not.toHaveProperty('token');
    expect(wrong.body).not.toHaveProperty('token');
    expect(JSON.stringify(wrong.body)).not.toContain(user.password);
  });

  it('recusa conta inativa somente depois de validar a senha', async () => {
    const user = await seedUser(UserRole.Buyer, UserStatus.Inactive);
    const correct = await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials(user.email))
      .expect(401);
    const wrong = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: 'WrongPassword!42' })
      .expect(401);

    expect(correct.body.message).toBe('Conta inativa');
    expect(wrong.body.message).toBe('Credenciais inválidas');
    expect(correct.body).not.toHaveProperty('token');
    expect(wrong.body).not.toHaveProperty('token');
  });

  it.each([
    ['email ausente', { password }, 'email'],
    ['email nulo', { email: null, password }, 'email'],
    ['email numérico', { email: 123, password }, 'email'],
    ['email inválido', { email: 'invalid', password }, 'email'],
    ['senha ausente', { email: 'ana@example.com' }, 'password'],
    ['senha nula', { email: 'ana@example.com', password: null }, 'password'],
    [
      'senha numérica',
      { email: 'ana@example.com', password: 123456 },
      'password',
    ],
    [
      'senha curta',
      { email: 'ana@example.com', password: 'short' },
      'password',
    ],
  ])('retorna 400 para %s', async (_name, body, field) => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(body)
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining(field)]),
    );
    expect(response.body).not.toHaveProperty('token');
    expect(response.body).not.toHaveProperty('password');
    expect(JSON.stringify(response.body)).not.toContain(password);
    expect(JSON.stringify(response.body)).not.toContain(secret);
  });
});
