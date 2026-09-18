import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from 'vitest';
import { createJwtOptions } from '../src/auth/jwt-options.js';

function configWithSecret(secret: string | undefined): ConfigService {
  return { get: () => secret } as unknown as ConfigService;
}

describe('configuração do JWT', () => {
  it.each([undefined, '', '   '])(
    'recusa segredo ausente ou vazio: %s',
    (secret) => {
      expect(() => createJwtOptions(configWithSecret(secret))).toThrow(
        'JWT_SECRET deve ser configurado',
      );
    },
  );

  it('usa o segredo configurado para assinar novos tokens por 24 horas', async () => {
    const first = new JwtService(
      createJwtOptions(configWithSecret('first-secret')),
    );
    const second = new JwtService(
      createJwtOptions(configWithSecret('second-secret')),
    );
    const firstToken = await first.signAsync(
      { email: 'ana@example.com', role: 'buyer' },
      { subject: 'user-id' },
    );
    const secondToken = await second.signAsync(
      { email: 'ana@example.com', role: 'buyer' },
      { subject: 'user-id' },
    );

    const firstClaims = first.verify<{ sub: string; iat: number; exp: number }>(
      firstToken,
    );
    const secondClaims = second.verify<{
      sub: string;
      iat: number;
      exp: number;
    }>(secondToken);
    expect(firstClaims.sub).toBe('user-id');
    expect(firstClaims.exp - firstClaims.iat).toBe(86_400);
    expect(secondClaims.exp - secondClaims.iat).toBe(86_400);
    expect(() => first.verify(secondToken)).toThrow();
    expect(() => second.verify(firstToken)).toThrow();
  });
});
