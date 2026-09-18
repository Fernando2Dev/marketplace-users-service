import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createValidationPipe } from '../src/common/validation/create-validation-pipe.js';
import { User, UserRole, UserStatus } from '../src/users/user.entity.js';

process.env.NODE_ENV = 'test';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = process.env.USERS_TEST_DB_PORT ?? '5436';
process.env.DB_USERNAME = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.DB_DATABASE = 'users_test_db';

const validInput = () => ({
  email: 'register@example.com',
  password: 'NeverEchoThis!42',
  firstName: 'Ana',
  lastName: 'Silva',
  role: UserRole.Seller,
});

type RequestBody = Record<string, unknown>;

const invalidCases: Array<{
  name: string;
  field: string;
  body: () => RequestBody;
}> = [];

for (const field of ['email', 'password', 'firstName', 'lastName', 'role']) {
  invalidCases.push({
    name: `${field} ausente`,
    field,
    body: () => {
      const body: RequestBody = validInput();
      delete body[field];
      return body;
    },
  });
  invalidCases.push({
    name: `${field} nulo`,
    field,
    body: () => ({ ...validInput(), [field]: null }),
  });
  invalidCases.push({
    name: `${field} com tipo incorreto`,
    field,
    body: () => ({ ...validInput(), [field]: 12345 }),
  });
}

invalidCases.push(
  {
    name: 'email inválido',
    field: 'email',
    body: () => ({ ...validInput(), email: 'invalid-email' }),
  },
  {
    name: 'senha curta',
    field: 'password',
    body: () => ({ ...validInput(), password: 'short' }),
  },
  ...['firstName', 'lastName'].flatMap((field) => [
    {
      name: `${field} vazio`,
      field,
      body: () => ({ ...validInput(), [field]: '' }),
    },
    {
      name: `${field} somente com espaços`,
      field,
      body: () => ({ ...validInput(), [field]: '   ' }),
    },
    {
      name: `${field} com mais de 100 caracteres`,
      field,
      body: () => ({ ...validInput(), [field]: 'A'.repeat(101) }),
    },
  ]),
  {
    name: 'role fora do enum',
    field: 'role',
    body: () => ({ ...validInput(), role: 'admin' }),
  },
);

for (const field of ['status', 'id', 'createdAt', 'updatedAt', 'extra']) {
  invalidCases.push({
    name: `campo extra ${field}`,
    field,
    body: () => ({ ...validInput(), [field]: 'forbidden' }),
  });
}

describe('POST /auth/register', () => {
  let app: INestApplication;
  let users: Repository<User>;

  beforeAll(async () => {
    const { AppModule } = await import('../src/app.module.js');
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(createValidationPipe());
    await app.init();
    users = app.get(DataSource).getRepository(User);
    await users.clear();
  });

  afterEach(async () => {
    await users.clear();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('cria um usuário com hash bcrypt e retorna somente os oito campos públicos', async () => {
    const input = validInput();
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(input)
      .expect(201);

    expect(Object.keys(response.body).sort()).toEqual(
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
    expect(response.body).toMatchObject({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      status: UserStatus.Active,
      id: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(response.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu,
    );
    expect(Number.isNaN(Date.parse(response.body.createdAt))).toBe(false);
    expect(Number.isNaN(Date.parse(response.body.updatedAt))).toBe(false);

    const stored = await users.findBy({ email: input.email });
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      id: response.body.id,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      status: UserStatus.Active,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    expect(stored[0].password).not.toBe(input.password);
    expect(await bcrypt.compare(input.password, stored[0].password)).toBe(true);
    expect(bcrypt.getRounds(stored[0].password)).toBe(10);
  });

  it('aceita o role buyer', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...validInput(), role: UserRole.Buyer })
      .expect(201);
    expect(response.body.role).toBe(UserRole.Buyer);
  });

  it.each(invalidCases)('retorna 400 para $name', async ({ field, body }) => {
    const input = body();
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(input)
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        { field, message: expect.any(String) },
      ]),
    );
    expect(response.body).not.toHaveProperty('password');
    if (typeof input.password === 'string') {
      expect(JSON.stringify(response.body)).not.toContain(input.password);
    }
    expect(await users.count()).toBe(0);
  });

  it('lista os campos de múltiplas restrições violadas', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...validInput(), email: 'invalid-email', firstName: '   ' })
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        { field: 'email', message: expect.any(String) },
        { field: 'firstName', message: expect.any(String) },
      ]),
    );
    expect(await users.count()).toBe(0);
  });

  it('retorna 409 para email existente sem duplicar o registro', async () => {
    const input = validInput();
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(input)
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(input)
      .expect(409);

    expect(response.body.message).toMatch(/email/iu);
    expect(response.body).not.toHaveProperty('password');
    expect(JSON.stringify(response.body)).not.toContain(input.password);
    expect(await users.countBy({ email: input.email })).toBe(1);
  });

  it('mantém um registro quando duas requisições disputam o mesmo email', async () => {
    const input = validInput();
    const responses = await Promise.all([
      request(app.getHttpServer()).post('/auth/register').send(input),
      request(app.getHttpServer()).post('/auth/register').send(input),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);
    expect(await users.countBy({ email: input.email })).toBe(1);
    for (const response of responses) {
      expect(response.body).not.toHaveProperty('password');
      expect(JSON.stringify(response.body)).not.toContain(input.password);
    }
  });
});
