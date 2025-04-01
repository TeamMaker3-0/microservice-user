// src/users/dto/create-user.dto.ts
import { IsString, IsEmail, IsOptional, Length , MinLength} from 'class-validator';

export class CreateUserDto {

  @IsString()
  @Length(2, 100)
  name: string;

  @IsString()
  run: string; // RUN/identificador único, ajustar validaciones según el formato que uses

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(4)
  password: string;

  @IsString()
  role: string; // Ej. 'profesor' | 'estudiante' etc.

  @IsString()
  @IsOptional()
  eneatype: string; // O podría ser un enum si lo deseas
}
