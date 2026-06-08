import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { CursosService } from '../../application/cursos.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cursos')
export class CursosController {
  constructor(private readonly cursosService: CursosService) {}

  @Roles('Administrador')
  @Get('sin-horario')
  async findSinHorario() {
    return this.cursosService.findSinHorario();
  }

  @Roles('Instructor')
  @Get('mis-fichas-lideradas/:liderId')
  async findMisFichasLideradas(@Param('liderId') liderId: string) {
    return this.cursosService.findMisFichasLideradas(liderId);
  }

  @Roles('Administrador', 'Instructor', 'Aprendiz')
  @Get()
  async findAll(@Query('area') area?: string, @Query('programa') programa?: string) {
    return this.cursosService.findAll(area, programa);
  }

  @Roles('Administrador', 'Instructor', 'Aprendiz')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.cursosService.findOne(id);
  }

  @Roles('Administrador')
  @Post()
  async create(@Body() data: any) {
    return this.cursosService.create(data);
  }

  @Roles('Administrador')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.cursosService.update(id, data);
  }

  @Roles('Administrador')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.cursosService.delete(id);
  }
}
