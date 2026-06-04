import { IsString, IsEmail, IsNotEmpty, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  apellido!: string;

  @IsString()
  @IsNotEmpty()
  tipo_documento!: string;

  @IsString()
  @IsNotEmpty()
  numero_documento!: string;

  @IsEmail()
  @IsNotEmpty()
  correo!: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsUUID()
  @IsNotEmpty()
  municipio_id!: string;

  @IsString()
  @IsOptional()
  genero?: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsNotEmpty()
  rol_nombre!: string; // 'Administrador', 'Instructor', 'Aprendiz'

  @IsUUID()
  @IsOptional()
  area_id?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  aplicativos_ids?: string[];
}
