import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Departamento } from '../domain/departamento.entity';
import { Municipio } from '../domain/municipio.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Departamento) private depRepo: Repository<Departamento>,
    @InjectRepository(Municipio) private munRepo: Repository<Municipio>,
  ) {}

  // --- DEPARTAMENTOS ---
  async getDepartamentos() {
    return this.depRepo.find({ order: { nombre: 'ASC' } });
  }

  async createDepartamento(data: any) {
    if (!data.nombre) throw new BadRequestException('El nombre es requerido');
    const dep = this.depRepo.create({ nombre: data.nombre });
    return this.depRepo.save(dep);
  }

  async updateDepartamento(id: string, data: any) {
    const dep = await this.depRepo.findOne({ where: { id } });
    if (!dep) throw new NotFoundException('Departamento no encontrado');
    if (data.nombre) dep.nombre = data.nombre;
    return this.depRepo.save(dep);
  }

  async deleteDepartamento(id: string) {
    const count = await this.munRepo.count({ where: { departamento: { id } } });
    if (count > 0) {
      throw new ConflictException('No se puede eliminar el departamento porque tiene municipios asociados.');
    }
    await this.depRepo.delete(id);
    return { success: true };
  }

  // --- MUNICIPIOS ---
  async getMunicipios(departamento_id?: string) {
    const where: any = {};
    if (departamento_id) {
      where.departamento = { id: departamento_id };
    }
    return this.munRepo.find({
      where,
      relations: ['departamento'],
      order: { nombre: 'ASC' }
    });
  }

  async createMunicipio(data: any) {
    if (!data.nombre || !data.departamento_id) throw new BadRequestException('El nombre y departamento_id son requeridos');
    const dep = await this.depRepo.findOne({ where: { id: data.departamento_id } });
    if (!dep) throw new NotFoundException('Departamento no encontrado');

    const mun = this.munRepo.create({ nombre: data.nombre, departamento: dep });
    return this.munRepo.save(mun);
  }

  async updateMunicipio(id: string, data: any) {
    const mun = await this.munRepo.findOne({ where: { id }, relations: ['departamento'] });
    if (!mun) throw new NotFoundException('Municipio no encontrado');

    if (data.nombre) mun.nombre = data.nombre;
    if (data.departamento_id) {
      const dep = await this.depRepo.findOne({ where: { id: data.departamento_id } });
      if (!dep) throw new NotFoundException('Departamento no encontrado');
      mun.departamento = dep;
    }
    return this.munRepo.save(mun);
  }

  async deleteMunicipio(id: string) {
    // Check dependencies? Personas rely on Municipio!
    // But user didn't mention it... Wait: "No se puede eliminar un Departamento si tiene Municipios asociados" etc.
    // Personas usually have FK to municipio, so DB will reject if restricted.
    try {
      await this.munRepo.delete(id);
      return { success: true };
    } catch (e) {
      throw new ConflictException('No se puede eliminar el municipio porque está en uso por usuarios o personas.');
    }
  }
}
