import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Area } from '../domain/area.entity';
import { Programa } from '../../erp-academics/domain/programa.entity';
import { Usuario } from '../../erp-users/domain/usuario.entity';

@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(Area) private readonly areaRepo: Repository<Area>,
    @InjectRepository(Programa) private readonly programaRepo: Repository<Programa>,
    @InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async findAll() {
    return this.areaRepo.find({
      relations: ['sede', 'lider'],
    });
  }

  async findOne(id: string) {
    const area = await this.areaRepo.findOne({
      where: { id },
      relations: ['sede', 'lider'],
    });
    if (!area) throw new NotFoundException(`Área con ID ${id} no encontrada`);
    return area;
  }

  async findProgramas(areaId: string) {
    return this.programaRepo.find({
      where: { area: { id: areaId } },
    });
  }

  async findInstructores() {
    // Users defined instruction: Returns all active Instructors regardless of the Area parameter
    return this.usuarioRepo.find({
      where: {
        estado: true,
        rol: { nombre: 'Instructor' },
      },
      relations: ['persona', 'rol'],
    });
  }

  async create(data: any) {
    const area = this.areaRepo.create(data as Partial<Area>);
    if (data.lider_id) area.lider = { id: data.lider_id } as any;
    if (data.sede_id) area.sede = { id: data.sede_id } as any;
    return this.areaRepo.save(area);
  }

  async update(id: string, data: any) {
    const area = await this.findOne(id);
    if (data.nombre) area.nombre = data.nombre;
    if (data.lider_id !== undefined) area.lider = data.lider_id ? { id: data.lider_id } as any : null;
    if (data.sede_id !== undefined) area.sede = data.sede_id ? { id: data.sede_id } as any : null;

    await this.areaRepo.save(area);
    return this.findOne(id);
  }

  async delete(id: string) {
    const count = await this.programaRepo.count({ where: { area: { id } } });
    if (count > 0) {
      throw new ConflictException('No se puede eliminar el área porque tiene programas asociados.');
    }
    const result = await this.areaRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Área con ID ${id} no encontrada`);
    return { deleted: true };
  }
}
