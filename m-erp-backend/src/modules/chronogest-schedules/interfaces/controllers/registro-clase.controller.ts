import { Controller, Post, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { RegistroClaseAction } from '../../application/actions/registro-clase.action';

@Controller('horarios/registro-clases')
export class RegistroClaseController {
  constructor(private readonly registroClaseAction: RegistroClaseAction) {}

  @Post('activar')
  async activarClase(
    @Body() body: { horario_detalle_id: string; instructor_id: string; fecha: string; ambiente_id?: string }
  ) {
    return this.registroClaseAction.activarClase(body);
  }

  @Get()
  async obtenerPorFecha(
    @Query('fecha') fecha?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string
  ) {
    if (fechaInicio && fechaFin) {
      return this.registroClaseAction.obtenerPorRangoFechas(fechaInicio, fechaFin);
    }
    if (fecha) {
      return this.registroClaseAction.obtenerPorFecha(fecha);
    }
    return [];
  }

  @Get('instructor/:id')
  async obtenerPorInstructor(
    @Param('id') instructorId: string,
    @Query('fecha') fecha?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string
  ) {
    if (fechaInicio && fechaFin) {
      return this.registroClaseAction.obtenerPorInstructorYRango(instructorId, fechaInicio, fechaFin);
    }
    if (fecha) {
      return this.registroClaseAction.obtenerPorInstructor(instructorId, fecha);
    }
    return [];
  }

  @Patch(':id/finalizar')
  async finalizarClase(@Param('id') id: string) {
    return this.registroClaseAction.finalizarClase(id);
  }

  @Patch(':id/suspender')
  async suspenderClase(@Param('id') id: string, @Body() body: { motivo: string }) {
    return this.registroClaseAction.suspenderClase(id, body.motivo);
  }

  @Patch(':id/reanudar')
  async reanudarClase(@Param('id') id: string) {
    return this.registroClaseAction.reanudarClase(id);
  }

  @Patch(':id/aprobar-suspension')
  async aprobarSuspension(@Param('id') id: string) {
    return this.registroClaseAction.aprobarSuspension(id);
  }

  @Get('ambientes-disponibles')
  async obtenerAmbientesDisponibles(
    @Query('fecha') fecha: string,
    @Query('jornada') jornada?: string
  ) {
    return this.registroClaseAction.obtenerAmbientesDisponibles(fecha, jornada);
  }
}
