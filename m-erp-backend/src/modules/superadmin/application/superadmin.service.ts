import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../erp-centers/domain/entities/tenant.entity';
import { Usuario } from '../../erp-users/domain/usuario.entity';
import { Persona } from '../../erp-users/domain/persona.entity';

@Injectable()
export class SuperadminService {
  constructor(
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Persona) private personaRepo: Repository<Persona>,
  ) {}

  async getDashboardStats() {
    const totalSedes = await this.tenantRepo.count();
    const totalUsuarios = await this.usuarioRepo.count();
    // Simulate other metrics for now
    const totalFichas = 0; 
    const totalClasesHoy = 0;

    return {
      totalSedes,
      totalUsuarios,
      totalFichas,
      totalClasesHoy,
    };
  }

  async getSedes() {
    return this.tenantRepo.find();
  }

  async createSede(data: Partial<Tenant>) {
    const tenant = this.tenantRepo.create(data);
    return this.tenantRepo.save(tenant);
  }

  async updateSede(id: string, data: Partial<Tenant>) {
    await this.tenantRepo.update(id, data);
    return this.tenantRepo.findOne({ where: { id } });
  }

  async deleteSede(id: string) {
    return this.tenantRepo.delete(id);
  }

  async getUsuarios() {
    return this.usuarioRepo.find({ relations: ['persona', 'rol'] });
  }

  async getReportes() {
    return {
      mensaje: 'Estadísticas consolidadas'
    };
  }
}
