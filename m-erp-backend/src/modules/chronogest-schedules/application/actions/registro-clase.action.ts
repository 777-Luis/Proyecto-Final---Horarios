import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IRegistroClaseRepository } from '../../domain/interfaces/registro-clase.repository.interface';
import { EstadoRegistroClase, RegistroClase } from '../../domain/entities/registro-clase.entity';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { HorarioDetalle } from '../../domain/horario-detalle.entity';

@Injectable()
export class RegistroClaseAction {
  constructor(
    @Inject('IRegistroClaseRepository')
    private readonly repository: IRegistroClaseRepository,
    @InjectRepository(HorarioDetalle)
    private readonly horarioDetalleRepo: Repository<HorarioDetalle>
  ) {}

  async activarClase(data: {
    horario_detalle_id: string;
    instructor_id: string;
    fecha: string;
    ambiente_id?: string;
  }): Promise<RegistroClase> {
    const detalle = await this.horarioDetalleRepo.findOne({ where: { id: data.horario_detalle_id } });
    if (!detalle) {
      throw new NotFoundException('Horario detalle no encontrado');
    }

    if (detalle.instructor?.id && detalle.instructor.id !== data.instructor_id && !detalle.es_transversal) {
       // if instructor check is strict, uncomment and adjust based on actual data
       // throw new BadRequestException('El instructor no está asignado a este horario');
    }

    let registro = await this.repository.obtenerPorHorarioDetalleYFecha(data.horario_detalle_id, data.fecha);

    const horaActivacion = new Date();
    
    // Calcular minutos retraso
    const [horas, minutos] = detalle.hora_inicio.split(':').map(Number);
    const fechaInicio = new Date(horaActivacion);
    fechaInicio.setHours(horas, minutos, 0, 0);

    let minutosRetraso = 0;
    if (horaActivacion > fechaInicio) {
      const diffMs = horaActivacion.getTime() - fechaInicio.getTime();
      minutosRetraso = Math.floor(diffMs / 60000);
    }

    if (registro) {
      return this.repository.actualizar(registro.id, {
        hora_activacion: horaActivacion,
        estado: EstadoRegistroClase.ACTIVA,
        minutos_retraso: minutosRetraso,
        ambiente_id: data.ambiente_id || registro.ambiente_id,
      }) as Promise<RegistroClase>;
    }

    return this.repository.crear({
      horario_detalle_id: data.horario_detalle_id,
      instructor_id: data.instructor_id,
      fecha: data.fecha,
      hora_activacion: horaActivacion,
      estado: EstadoRegistroClase.ACTIVA,
      minutos_retraso: minutosRetraso,
      ambiente_id: data.ambiente_id,
      es_transversal: detalle.es_transversal
    });
  }

  async finalizarClase(id: string): Promise<RegistroClase> {
    const registro = await this.repository.obtenerPorId(id);
    if (!registro) {
      throw new NotFoundException('Registro de clase no encontrado');
    }

    return this.repository.actualizar(id, {
      estado: EstadoRegistroClase.FINALIZADA,
    }) as Promise<RegistroClase>;
  }

  async suspenderClase(id: string, motivo: string): Promise<RegistroClase> {
    const registro = await this.repository.obtenerPorId(id);
    if (!registro) {
      throw new NotFoundException('Registro de clase no encontrado');
    }

    return this.repository.actualizar(id, {
      estado: EstadoRegistroClase.SUSPENDIDA,
      motivo_suspension: motivo,
      suspension_aprobada: false,
    }) as Promise<RegistroClase>;
  }

  async reanudarClase(id: string): Promise<RegistroClase> {
    const registro = await this.repository.obtenerPorId(id);
    if (!registro) {
      throw new NotFoundException('Registro de clase no encontrado');
    }

    return this.repository.actualizar(id, {
      estado: EstadoRegistroClase.ACTIVA,
    }) as Promise<RegistroClase>;
  }

  async aprobarSuspension(id: string): Promise<RegistroClase> {
    const registro = await this.repository.obtenerPorId(id);
    if (!registro) {
      throw new NotFoundException('Registro de clase no encontrado');
    }

    return this.repository.actualizar(id, {
      suspension_aprobada: true,
    }) as Promise<RegistroClase>;
  }

  async obtenerPorFecha(fecha: string): Promise<RegistroClase[]> {
    return this.repository.obtenerPorFecha(fecha);
  }

  async obtenerPorRangoFechas(fechaInicio: string, fechaFin: string): Promise<RegistroClase[]> {
    return this.repository.obtenerPorRangoFechas(fechaInicio, fechaFin);
  }

  async obtenerPorInstructor(instructor_id: string, fecha: string): Promise<RegistroClase[]> {
    return this.repository.obtenerPorInstructorYFecha(instructor_id, fecha);
  }

  async obtenerPorInstructorYRango(instructor_id: string, fechaInicio: string, fechaFin: string): Promise<RegistroClase[]> {
    return this.repository.obtenerPorInstructorYRango(instructor_id, fechaInicio, fechaFin);
  }

  async obtenerAmbientesDisponibles(fecha: string, jornada?: string): Promise<any[]> {
    return this.repository.obtenerAmbientesDisponibles(fecha, jornada);
  }

  async cerrarJornada(fecha: string, horariosProgramados: HorarioDetalle[]): Promise<void> {
    // 1. Cierre forzoso de clases activas o suspendidas
    await this.repository.actualizarMasivo(
      { fecha, estado: In([EstadoRegistroClase.ACTIVA, EstadoRegistroClase.SUSPENDIDA]) },
      { estado: EstadoRegistroClase.FINALIZADA }
    );

    // 2. Insertar inasistencias para horarios que no tienen registro
    const registrosExistentes = await this.repository.obtenerPorFecha(fecha);
    const setDetallesRegistrados = new Set(registrosExistentes.map(r => r.horario_detalle_id || r.horario_detalle?.id));

    const inasistencias = horariosProgramados
      .filter(h => !setDetallesRegistrados.has(h.id))
      .map(h => ({
        horario_detalle_id: h.id,
        instructor_id: h.instructor?.id,
        fecha,
        estado: EstadoRegistroClase.NO_ASISTIO,
        es_transversal: h.es_transversal,
      }));

    const inasistenciasValidas = inasistencias.filter(i => i.instructor_id);

    if (inasistenciasValidas.length > 0) {
      await this.repository.crearMasivo(inasistenciasValidas);
    }
  }
}
