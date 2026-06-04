import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CentroFormacion } from '../domain/centro-formacion.entity';
import { Sede } from '../domain/sede.entity';
import { Area } from '../domain/area.entity';

@Injectable()
export class CentersService {
  constructor(
    @InjectRepository(CentroFormacion) private centroRepo: Repository<CentroFormacion>,
    @InjectRepository(Sede) private sedeRepo: Repository<Sede>,
    @InjectRepository(Area) private areaRepo: Repository<Area>,
  ) {}

  // --- CENTROS ---
  async getCentros() {
    return this.centroRepo.find({ order: { nombre: 'ASC' } });
  }

  async createCentro(data: any) {
    if (!data.nombre) throw new BadRequestException('El nombre es requerido');
    const centro = this.centroRepo.create({ nombre: data.nombre });
    return this.centroRepo.save(centro);
  }

  async updateCentro(id: string, data: any) {
    const centro = await this.centroRepo.findOne({ where: { id } });
    if (!centro) throw new NotFoundException('Centro no encontrado');
    if (data.nombre) centro.nombre = data.nombre;
    return this.centroRepo.save(centro);
  }

  async deleteCentro(id: string) {
    const count = await this.sedeRepo.count({ where: { centro_formacion: { id } } });
    if (count > 0) {
      throw new ConflictException('No se puede eliminar el centro porque tiene sedes asociadas.');
    }
    await this.centroRepo.delete(id);
    return { success: true };
  }

  // --- SEDES ---
  async getSedes(centro_id?: string) {
    const where: any = {};
    if (centro_id) {
      where.centro_formacion = { id: centro_id };
    }
    return this.sedeRepo.find({
      where,
      relations: ['centro_formacion'],
      order: { nombre: 'ASC' }
    });
  }

  async createSede(data: any) {
    if (!data.nombre || !data.centro_id) throw new BadRequestException('El nombre y centro_id son requeridos');
    const centro = await this.centroRepo.findOne({ where: { id: data.centro_id } });
    if (!centro) throw new NotFoundException('Centro no encontrado');

    const sede = this.sedeRepo.create({ nombre: data.nombre, centro_formacion: centro });
    return this.sedeRepo.save(sede);
  }

  async updateSede(id: string, data: any) {
    const sede = await this.sedeRepo.findOne({ where: { id }, relations: ['centro_formacion'] });
    if (!sede) throw new NotFoundException('Sede no encontrada');

    if (data.nombre) sede.nombre = data.nombre;
    if (data.centro_id) {
      const centro = await this.centroRepo.findOne({ where: { id: data.centro_id } });
      if (!centro) throw new NotFoundException('Centro no encontrado');
      sede.centro_formacion = centro;
    }
    return this.sedeRepo.save(sede);
  }

  async deleteSede(id: string) {
    const count = await this.areaRepo.count({ where: { sede: { id } } });
    if (count > 0) {
      throw new ConflictException('No se puede eliminar la sede porque tiene áreas asociadas.');
    }
    await this.sedeRepo.delete(id);
    return { success: true };
  }
}
