import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterUsersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsString()
  @IsOptional()
  role?: string; // Tab being viewed

  @IsString()
  @IsOptional()
  area_id?: string;

  @IsString()
  @IsOptional()
  programa_id?: string;

  @IsString()
  @IsOptional()
  curso_id?: string;

  @IsString()
  @IsOptional()
  search?: string; // Documento o Nombre
}
