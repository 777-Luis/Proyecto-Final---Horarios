import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ProgramasService } from '../../application/programas.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('programas')
export class ProgramasController {
  constructor(private readonly programasService: ProgramasService) {}

  @Roles('Administrador', 'Instructor')
  @Get()
  async findAll(@Query('area_id') area_id?: string) {
    return this.programasService.getProgramas(area_id);
  }

  @Roles('Administrador')
  @Post()
  async create(@Body() data: any) {
    return this.programasService.createPrograma(data);
  }

  @Roles('Administrador')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.programasService.updatePrograma(id, data);
  }

  @Roles('Administrador')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.programasService.deletePrograma(id);
  }
}
