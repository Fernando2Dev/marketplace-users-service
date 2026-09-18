import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export function getJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');
  if (!secret?.trim()) {
    throw new Error('JWT_SECRET deve ser configurado');
  }
  return secret;
}

export function createJwtOptions(config: ConfigService): JwtModuleOptions {
  return {
    secret: getJwtSecret(config),
    signOptions: { expiresIn: '24h' },
  };
}
