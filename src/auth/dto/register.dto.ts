import {
  IsDefined,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../users/entity/user.entity.js';

export class RegisterDto {
  @IsDefined({ message: 'email é obrigatório' })
  @IsString({ message: 'email deve ser uma string' })
  @IsEmail({}, { message: 'email deve ter formato válido' })
  email: string;

  @IsDefined({ message: 'password é obrigatório' })
  @IsString({ message: 'password deve ser uma string' })
  @MinLength(6, { message: 'password deve ter pelo menos 6 caracteres' })
  password: string;

  @IsDefined({ message: 'firstName é obrigatório' })
  @IsString({ message: 'firstName deve ser uma string' })
  @IsNotEmpty({ message: 'firstName não pode ser vazio' })
  @Matches(/\S/u, {
    message: 'firstName deve conter caracteres além de espaços',
  })
  @MaxLength(100, { message: 'firstName deve ter no máximo 100 caracteres' })
  firstName: string;

  @IsDefined({ message: 'lastName é obrigatório' })
  @IsString({ message: 'lastName deve ser uma string' })
  @IsNotEmpty({ message: 'lastName não pode ser vazio' })
  @Matches(/\S/u, {
    message: 'lastName deve conter caracteres além de espaços',
  })
  @MaxLength(100, { message: 'lastName deve ter no máximo 100 caracteres' })
  lastName: string;

  @IsDefined({ message: 'role é obrigatório' })
  @IsString({ message: 'role deve ser uma string' })
  @IsEnum(UserRole, { message: 'role deve ser seller ou buyer' })
  role: UserRole;
}
