import { BadRequestException, ValidationPipe } from '@nestjs/common';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    validationError: { target: false, value: false },
    exceptionFactory: (validationErrors) =>
      new BadRequestException({
        statusCode: 400,
        errors: validationErrors.flatMap((error) =>
          Object.values(error.constraints ?? {}).map((message) => ({
            field: error.property,
            message,
          })),
        ),
      }),
  });
}
