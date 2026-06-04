import { Controller, Get, Post, Param, Body, UseGuards, Req, Res, Query, Patch, Delete } from '@nestjs/common';
import type { Response } from 'express';
import { HorariosService } from '../../application/horarios.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('horarios')
export class HorariosController {
  constructor(private readonly service: HorariosService) {}

  @Roles('Administrador')
  @Roles('Administrador')
  @Get('cursos-sin-horario')
  async fetchCursosSinHorario(@Req() req: any) {
    const rawToken = req.headers.authorization;
    return this.service.fetchCursosDisponibles(rawToken);
  }

  @Roles('Administrador', 'Instructor', 'Aprendiz')
  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Roles('Administrador')
  @Get('ambientes-disponibles')
  async fetchAmbientesDisponibles(@Req() req: any, @Query('jornada') jornada: string, @Query('ignore_curso_id') ignoreCursoId?: string) {
    const rawToken = req.headers.authorization;
    return this.service.fetchAmbientesDisponibles(rawToken, jornada, ignoreCursoId);
  }

  @Roles('Administrador')
  @Post()
  async createHorario(@Body() body: any, @Req() req: any) {
    const rawToken = req.headers.authorization; 
    return this.service.create(body, rawToken);
  }

  @Roles('Administrador', 'Instructor', 'Aprendiz')
  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.service.generatePdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=horario_${id}.pdf`,
      'Content-Length': buffer.length,
    });
    
    res.end(buffer);
  }

  @Roles('Administrador', 'Instructor', 'Aprendiz')
  @Get('instructor/:id')
  async getHorariosByInstructor(@Param('id') id: string) {
    return this.service.getHorariosByInstructor(id);
  }

  @Roles('Administrador', 'Instructor', 'Aprendiz')
  @Get('aprendiz/:id')
  async getHorariosByAprendiz(@Param('id') id: string) {
    return this.service.getHorariosByAprendiz(id);
  }

  @Roles('Administrador', 'Instructor', 'Aprendiz')
  @Get(':id')
  async getHorario(@Param('id') id: string) {
    return this.service.getHorario(id);
  }

  @Roles('Administrador')
  @Post(':id/detalles')
  async addDetalle(@Param('id') id: string, @Body() body: any) {
    return this.service.addDetalle(id, body);
  }

  @Roles('Administrador', 'Instructor')
  @Patch('detalles/:id')
  async updateDetalle(@Param('id') id: string, @Body() body: any) {
    return this.service.updateDetalle(id, body);
  }

  @Roles('Administrador')
  @Delete('detalles/:id')
  async deleteDetalle(@Param('id') id: string) {
    return this.service.deleteDetalle(id);
  }
}
