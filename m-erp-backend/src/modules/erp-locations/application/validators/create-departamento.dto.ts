import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateDepartamentoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre!: string;
}
