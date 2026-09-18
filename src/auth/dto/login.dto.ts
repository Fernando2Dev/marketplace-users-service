import { IsDefined, IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsDefined({ message: 'email é obrigatório' })
  @IsString({ message: 'email deve ser uma string' })
  @IsEmail({}, { message: 'email deve ter formato válido' })
  email: string;

  @IsDefined({ message: 'password é obrigatório' })
  @IsString({ message: 'password deve ser uma string' })
  @MinLength(6, { message: 'password deve ter pelo menos 6 caracteres' })
  password: string;
}
