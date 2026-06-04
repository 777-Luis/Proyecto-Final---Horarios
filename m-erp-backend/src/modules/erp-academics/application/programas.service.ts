import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Programa } from '../domain/programa.entity';
import { Curso } from '../domain/curso.entity';
import { Area } from '../../erp-centers/domain/area.entity';

@Injectable()
export class ProgramasService {
  constructor(
    @InjectRepository(Programa) private programaRepo: Repository<Programa>,
    @InjectRepository(Curso) private cursoRepo: Repository<Curso>,
    @InjectRepository(Area) private areaRepo: Repository<Area>,
  ) {}

  async getProgramas(area_id?: string) {
    const where: any = {};
    if (area_id) {
      where.area = { id: area_id };
    }
    return this.programaRepo.find({
      where,
      relations: ['area'],
      order: { nombre: 'ASC' }
    });
  }

  async createPrograma(data: any) {
    if (!data.nombre || !data.area_id) throw new BadRequestException('El nombre y area_id son requeridos');
    const area = await this.areaRepo.findOne({ where: { id: data.area_id } });
    if (!area) throw new NotFoundException('Área no encontrada');

    const programa = this.programaRepo.create({ nombre: data.nombre, area, tipo_programa: data.tipo_programa });
    return this.programaRepo.save(programa);
  }

  async updatePrograma(id: string, data: any) {
    const programa = await this.programaRepo.findOne({ where: { id }, relations: ['area'] });
    if (!programa) throw new NotFoundException('Programa no encontrado');

    if (data.nombre) programa.nombre = data.nombre;
    if (data.tipo_programa) programa.tipo_programa = data.tipo_programa;
    if (data.area_id) {
      const area = await this.areaRepo.findOne({ where: { id: data.area_id } });
      if (!area) throw new NotFoundException('Área no encontrada');
      programa.area = area;
    }
    return this.programaRepo.save(programa);
  }

  async deletePrograma(id: string) {
    const count = await this.cursoRepo.count({ where: { programa: { id } } });
    if (count > 0) {
      throw new ConflictException('No se puede eliminar el programa porque tiene cursos asociados.');
    }
    await this.programaRepo.delete(id);
    return { success: true };
  }
}
