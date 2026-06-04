import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In, Between } from 'typeorm';
import { RegistroClase } from '../../domain/entities/registro-clase.entity';
import { IRegistroClaseRepository } from '../../domain/interfaces/registro-clase.repository.interface';
import { Ambiente } from '../../../erp-centers/domain/ambiente.entity';

@Injectable()
export class RegistroClaseRepository implements IRegistroClaseRepository {
  constructor(
    @InjectRepository(RegistroClase)
    private readonly repository: Repository<RegistroClase>,
    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>
  ) {}

  async crear(registro: Partial<RegistroClase>): Promise<RegistroClase> {
    const nuevoRegistro = this.repository.create(registro);
    return this.repository.save(nuevoRegistro);
  }

  async actualizar(id: string, registro: Partial<RegistroClase>): Promise<RegistroClase | null> {
    await this.repository.update(id, registro);
    return this.obtenerPorId(id);
  }

  async obtenerPorId(id: string): Promise<RegistroClase | null> {
    return this.repository.findOne({ where: { id }, relations: ['horario_detalle', 'instructor', 'ambiente'] });
  }

  async obtenerPorHorarioDetalleYFecha(horario_detalle_id: string, fecha: string): Promise<RegistroClase | null> {
    return this.repository.findOne({ 
      where: { horario_detalle_id, fecha }, 
      relations: ['horario_detalle', 'instructor', 'ambiente'] 
    });
  }

  async obtenerPorFecha(fecha: string): Promise<RegistroClase[]> {
    return this.repository.find({ 
      where: { fecha }, 
      relations: ['horario_detalle', 'instructor', 'ambiente'] 
    });
  }

  async obtenerPorRangoFechas(fechaInicio: string, fechaFin: string): Promise<RegistroClase[]> {
    return this.repository.find({
      where: { fecha: Between(fechaInicio, fechaFin) },
      relations: ['horario_detalle', 'instructor', 'ambiente']
    });
  }

  async obtenerPorInstructorYFecha(instructor_id: string, fecha: string): Promise<RegistroClase[]> {
    return this.repository.find({ 
      where: { instructor_id, fecha }, 
      relations: ['horario_detalle', 'instructor', 'ambiente'] 
    });
  }

  async obtenerPorInstructorYRango(instructor_id: string, fechaInicio: string, fechaFin: string): Promise<RegistroClase[]> {
    return this.repository.find({
      where: { instructor_id, fecha: Between(fechaInicio, fechaFin) },
      relations: ['horario_detalle', 'instructor', 'ambiente']
    });
  }

  async obtenerAmbientesDisponibles(fecha: string, jornada?: string): Promise<any[]> {
    // This is a simplified version. For a robust one we might need complex queries.
    // Assuming we just find all ambientes and filter those not in 'ACTIVA' or 'PENDIENTE' for that day/jornada
    const registrosOcupados = await this.repository.find({
      where: {
        fecha,
        estado: In(['pendiente', 'activa']),
      },
      relations: ['horario_detalle'],
    });

    const ambientesOcupadosIds = registrosOcupados
      .filter(r => r.ambiente_id)
      .map(r => r.ambiente_id);

    const query = this.ambienteRepository.createQueryBuilder('ambiente');
    
    if (ambientesOcupadosIds.length > 0) {
      query.where('ambiente.id NOT IN (:...ids)', { ids: ambientesOcupadosIds });
    }

    return query.getMany();
  }

  async actualizarMasivo(criterio: any, valores: Partial<RegistroClase>): Promise<void> {
    await this.repository.update(criterio, valores);
  }

  async crearMasivo(registros: Partial<RegistroClase>[]): Promise<void> {
    const nuevosRegistros = this.repository.create(registros);
    await this.repository.save(nuevosRegistros);
  }
}
