import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Curso } from '../domain/curso.entity';
import { Horario } from '../../chronogest-schedules/domain/horario.entity';

@Injectable()
export class CursosService {
  constructor(
    @InjectRepository(Curso) private readonly cursoRepo: Repository<Curso>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(areaId?: string, programaId?: string) {
    const qb = this.cursoRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.area', 'area')
      .leftJoinAndSelect('c.programa', 'programa')
      .leftJoinAndSelect('c.ambiente', 'ambiente')
      .leftJoinAndSelect('c.lider', 'lider');

    if (areaId) qb.andWhere('area.id = :areaId', { areaId });
    if (programaId) qb.andWhere('programa.id = :programaId', { programaId });

    return qb.getMany();
  }

  async findOne(id: string) {
    const curso = await this.cursoRepo.findOne({
      where: { id },
      relations: ['area', 'programa', 'ambiente', 'lider'],
    });
    if (!curso) throw new NotFoundException(`Curso con ID ${id} no encontrado`);
    return curso;
  }

  async findMisFichasLideradas(liderId: string) {
    return this.cursoRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.area', 'area')
      .leftJoinAndSelect('c.programa', 'programa')
      .leftJoinAndSelect('c.ambiente', 'ambiente')
      .leftJoinAndSelect('c.lider', 'lider')
      .where('lider.id = :liderId', { liderId })
      .getMany();
  }

  async findSinHorario() {
    return this.cursoRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.area', 'area')
      .leftJoinAndSelect('c.programa', 'programa')
      .leftJoinAndSelect('c.ambiente', 'ambiente')
      .leftJoinAndSelect('c.lider', 'lider')
      .leftJoin(Horario, 'h', 'h.curso_id = c.id')
      .where('h.id IS NULL')
      .getMany();
  }

  async create(data: any) {
    if (data.id_curso) {
      const existing = await this.cursoRepo.findOne({ where: { id_curso: data.id_curso } });
      if (existing) throw new ConflictException(`El código de curso ${data.id_curso} ya existe.`);
    }

    if (data.fecha_inicio) data.inicio_lectiva = data.fecha_inicio;
    if (data.fecha_fin_lectiva) data.fin_lectiva = data.fecha_fin_lectiva;

    if (data.area_id) {
      data.area = { id: data.area_id };
      delete data.area_id;
    }
    if (data.programa_id) {
      data.programa = { id: data.programa_id };
      delete data.programa_id;
    }
    if (data.ambiente_sugerido) {
      data.ambiente = { id: data.ambiente_sugerido };
      delete data.ambiente_sugerido;
    }
    if (data.lider_id) {
      data.lider = { id: data.lider_id };
      delete data.lider_id;
    }

    // Validar disponibilidad del ambiente en las fechas y jornada dadas
    const { inicio_lectiva, fin_lectiva, jornada, ambiente } = data;

    if (ambiente) {
      const ambienteId = typeof ambiente === 'string' ? ambiente : ambiente.id;

      const conflictingCourse = await this.cursoRepo.createQueryBuilder('c')
        .where('c.ambiente_id = :ambienteId', { ambienteId })
        .andWhere('c.jornada = :jornada', { jornada })
        .andWhere(
          '(c.inicio_lectiva <= :end AND c.fin_lectiva >= :start)',
          { start: inicio_lectiva, end: fin_lectiva }
        )
        .getOne();

      if (conflictingCourse) {
        throw new ConflictException(`El ambiente ya está asociado al curso ${conflictingCourse.id_curso} en la jornada ${jornada} para el rango de fechas proporcionado.`);
      }
    }

    const curso = this.cursoRepo.create(data as Partial<Curso>);
    return this.cursoRepo.save(curso);
  }

  async update(id: string, data: any) {
    if (data.id_curso) {
      const existing = await this.cursoRepo.findOne({ where: { id_curso: data.id_curso } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`El código de curso ${data.id_curso} ya existe.`);
      }
    }

    const updatePayload: any = { ...data };

    if (updatePayload.fecha_inicio) { updatePayload.inicio_lectiva = updatePayload.fecha_inicio; delete updatePayload.fecha_inicio; }
    if (updatePayload.fecha_fin_lectiva) { updatePayload.fin_lectiva = updatePayload.fecha_fin_lectiva; delete updatePayload.fecha_fin_lectiva; }

    if (updatePayload.area_id !== undefined) {
      updatePayload.area = updatePayload.area_id ? updatePayload.area_id : null;
      delete updatePayload.area_id;
    }
    if (updatePayload.programa_id !== undefined) {
      updatePayload.programa = updatePayload.programa_id ? updatePayload.programa_id : null;
      delete updatePayload.programa_id;
    }
    if (updatePayload.ambiente_sugerido !== undefined) {
      updatePayload.ambiente = updatePayload.ambiente_sugerido ? updatePayload.ambiente_sugerido : null;
      delete updatePayload.ambiente_sugerido;
    }
    if (updatePayload.lider_id !== undefined) {
      updatePayload.lider = updatePayload.lider_id ? updatePayload.lider_id : null;
      delete updatePayload.lider_id;
    }

    await this.cursoRepo.createQueryBuilder()
      .update(Curso)
      .set(updatePayload)
      .where("id = :id", { id })
      .execute();

    return this.findOne(id);
  }

  async delete(id: string) {
    const curso = await this.cursoRepo.findOne({ where: { id } });
    if (!curso) throw new NotFoundException(`Curso con ID ${id} no encontrado`);

    // Uses the request-scoped transaction (started by TenantInterceptor) via
    // this.dataSource.manager, instead of a standalone queryRunner/connection,
    // so these deletes run under the same RLS tenant context as the rest of the request.
    const manager = this.dataSource.manager;

    await manager.query(`DELETE FROM matriculas WHERE curso_id = $1`, [id]);

    const horarios = await manager.query(`SELECT id FROM horarios WHERE curso_id = $1`, [id]);
    if (horarios.length > 0) {
      const horarioId = horarios[0].id;
      await manager.query(`
        DELETE FROM registro_clases
        WHERE horario_detalle_id IN (
          SELECT id FROM horario_detalle WHERE horario_id = $1
        )
      `, [horarioId]);
      await manager.query(`DELETE FROM horario_detalle WHERE horario_id = $1`, [horarioId]);
      await manager.query(`DELETE FROM horarios WHERE id = $1`, [horarioId]);
    }

    await manager.delete(Curso, id);

    return { deleted: true };
  }
}
