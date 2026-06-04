import { IsString, IsNotEmpty, MinLength, IsEmail } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  new_password!: string;
}
