import { IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  oldPassword: string; // contraseña anterior

  @IsString()
  @MinLength(4)
  newPassword: string; // nueva contraseña

}
