import { Body, Controller, Post } from '@nestjs/common';
import { AuthService, RegisterResponse } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() input: RegisterDto): Promise<RegisterResponse> {
    return this.auth.register(input);
  }
}
