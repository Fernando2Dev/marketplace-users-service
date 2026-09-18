import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { createValidationPipe } from './common/validation/create-validation-pipe.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(createValidationPipe());

  const config = app.get(ConfigService);
  const port = Number(config.get<string>('PORT') ?? 3000);
  await app.listen(port);
}
await bootstrap();
