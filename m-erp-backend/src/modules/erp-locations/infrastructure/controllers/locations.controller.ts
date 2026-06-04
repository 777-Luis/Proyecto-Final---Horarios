import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { LocationsService } from '../../application/locations.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departamentos')
export class DepartamentosController {
  constructor(private readonly locationsService: LocationsService) {}

  @Roles('Administrador')
  @Get()
  async findAll() {
    return this.locationsService.getDepartamentos();
  }

  @Roles('Administrador')
  @Post()
  async create(@Body() data: any) {
    return this.locationsService.createDepartamento(data);
  }

  @Roles('Administrador')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.locationsService.updateDepartamento(id, data);
  }

  @Roles('Administrador')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.locationsService.deleteDepartamento(id);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('municipios')
export class MunicipiosController {
  constructor(private readonly locationsService: LocationsService) {}

  @Roles('Administrador', 'Instructor', 'Aprendiz')
  @Get()
  async findAll(@Query('departamento_id') departamento_id?: string) {
    return this.locationsService.getMunicipios(departamento_id);
  }

  @Roles('Administrador')
  @Post()
  async create(@Body() data: any) {
    return this.locationsService.createMunicipio(data);
  }

  @Roles('Administrador')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.locationsService.updateMunicipio(id, data);
  }

  @Roles('Administrador')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.locationsService.deleteMunicipio(id);
  }
}
