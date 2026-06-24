import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Ambiente } from '../domain/ambiente.entity';
import { Curso } from '../../erp-academics/domain/curso.entity';

@Injectable()
export class AmbientesService {
  constructor(
    @InjectRepository(Ambiente) private readonly ambienteRepo: Repository<Ambiente>,
    @InjectRepository(Curso) private readonly cursoRepo: Repository<Curso>,
  ) {}

  async findAll(areaId?: string) {
    const qb = this.ambienteRepo.createQueryBuilder('a').leftJoinAndSelect('a.area', 'area');
    if (areaId) {
      qb.where('area.id = :areaId', { areaId })
        .orWhere('area.id IS NULL');
    }
    return qb.getMany();
  }

  async findOne(id: string) {
    const ambiente = await this.ambienteRepo.findOne({
      where: { id },
      relations: ['area'],
    });
    if (!ambiente) throw new NotFoundException(`Ambiente con ID ${id} no encontrado`);
    return ambiente;
  }

  async create(data: Partial<Ambiente> & { area_id?: string }) {
    const ambiente = this.ambienteRepo.create(data);
    if (data.area_id) {
      ambiente.area = { id: data.area_id } as any;
    }
    return this.ambienteRepo.save(ambiente);
  }

  async update(id: string, data: Partial<Ambiente> & { area_id?: string }) {
    try {
      const updatePayload: any = {};
      if (data.nombre !== undefined) updatePayload.nombre = data.nombre;
      if (data.capacidad !== undefined) updatePayload.capacidad = data.capacidad;
      if (data.area_id !== undefined) updatePayload.area = data.area_id ? data.area_id : null;

      await this.ambienteRepo.createQueryBuilder()
        .update(Ambiente)
        .set(updatePayload)
        .where("id = :id", { id })
        .execute();

      return await this.findOne(id);
    } catch (e: any) {
      console.error('Update Ambiente Error:', e);
      throw e;
    }
  }

  async delete(id: string) {
    const result = await this.ambienteRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Ambiente con ID ${id} no encontrado`);
    return { deleted: true };
  }

  // Business Logic Methods
  private getFormattedDate() {
    return new Date().toISOString().split('T')[0];
  }

  async findDisponiblesByJornada(jornada: string, ignoreCursoId?: string) {
    const now = this.getFormattedDate();

    // Encontrar ambientes ocupados
    const qbOccupied = this.cursoRepo.createQueryBuilder('c')
      .select('c.ambiente_id')
      .where('c.jornada = :jornada', { jornada })
      .andWhere('c.inicio_lectiva <= :now AND c.fin_lectiva >= :now', { now });

    if (ignoreCursoId) {
      qbOccupied.andWhere('c.id != :ignoreCursoId', { ignoreCursoId });
    }

    const occupiedCursos = await qbOccupied.getRawMany();

    const occupiedIds = occupiedCursos.map(c => c.ambiente_id).filter(id => id);

    const qb = this.ambienteRepo.createQueryBuilder('a').leftJoinAndSelect('a.area', 'area');
    
    if (occupiedIds.length > 0) {
      qb.where('a.id NOT IN (:...occupiedIds)', { occupiedIds });
    }

    return qb.getMany();
  }

  async getEstadoGlobal() {
    const now = this.getFormattedDate();
    const ambientes = await this.findAll();

    const cursosActivos = await this.cursoRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.ambiente', 'ambiente')
      .leftJoinAndSelect('c.programa', 'programa')
      .where('c.inicio_lectiva <= :now AND c.fin_lectiva >= :now', { now })
      .getMany();

    return ambientes.map(amb => {
      const activoManana = cursosActivos.find(c => c.ambiente?.id === amb.id && c.jornada === 'Mañana');
      const activoTarde = cursosActivos.find(c => c.ambiente?.id === amb.id && c.jornada === 'Tarde');

      return {
        id: amb.id,
        nombre: amb.nombre,
        area: amb.area ? { id: amb.area.id, nombre: amb.area.nombre } : null,
        capacidad: amb.capacidad,
        estado_manana: {
          disponible: !activoManana,
          curso: activoManana ? `${activoManana.id_curso} - ${activoManana.programa?.nombre}` : null
        },
        estado_tarde: {
          disponible: !activoTarde,
          curso: activoTarde ? `${activoTarde.id_curso} - ${activoTarde.programa?.nombre}` : null
        }
      };
    });
  }
}
