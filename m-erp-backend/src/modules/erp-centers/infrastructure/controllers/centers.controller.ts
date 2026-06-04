import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { CentersService } from '../../application/centers.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('centros')
export class CentrosController {
  constructor(private readonly centersService: CentersService) {}

  @Roles('Administrador')
  @Get()
  async findAll() {
    return this.centersService.getCentros();
  }

  @Roles('Administrador')
  @Post()
  async create(@Body() data: any) {
    return this.centersService.createCentro(data);
  }

  @Roles('Administrador')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.centersService.updateCentro(id, data);
  }

  @Roles('Administrador')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.centersService.deleteCentro(id);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sedes')
export class SedesController {
  constructor(private readonly centersService: CentersService) {}

  @Roles('Administrador', 'Instructor')
  @Get()
  async findAll(@Query('centro_id') centro_id?: string) {
    return this.centersService.getSedes(centro_id);
  }

  @Roles('Administrador')
  @Post()
  async create(@Body() data: any) {
    return this.centersService.createSede(data);
  }

  @Roles('Administrador')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.centersService.updateSede(id, data);
  }

  @Roles('Administrador')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.centersService.deleteSede(id);
  }
}
