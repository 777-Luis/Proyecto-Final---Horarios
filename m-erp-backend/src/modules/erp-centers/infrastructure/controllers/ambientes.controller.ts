import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AmbientesService } from '../../application/ambientes.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ambientes')
export class AmbientesController {
  constructor(private readonly ambientesService: AmbientesService) {}

  @Roles('Administrador')
  @Get('estado')
  async getEstadoGlobal() {
    return this.ambientesService.getEstadoGlobal();
  }

  @Roles('Administrador', 'Instructor')
  @Get('disponibles')
  async getDisponibles(@Query('jornada') jornada: string, @Query('ignore_curso_id') ignoreCursoId?: string) {
    if (!jornada) return [];
    return this.ambientesService.findDisponiblesByJornada(jornada, ignoreCursoId);
  }

  @Roles('Administrador')
  @Get()
  async findAll(@Query('area_id') areaId?: string) {
    return this.ambientesService.findAll(areaId);
  }

  @Roles('Administrador')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ambientesService.findOne(id);
  }

  @Roles('Administrador')
  @Post()
  async create(@Body() data: any) {
    return this.ambientesService.create(data);
  }

  @Roles('Administrador')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.ambientesService.update(id, data);
  }

  @Roles('Administrador')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.ambientesService.delete(id);
  }
}
