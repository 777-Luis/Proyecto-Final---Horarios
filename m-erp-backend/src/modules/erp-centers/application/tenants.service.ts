import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../domain/entities/tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find();
  }

  async create(data: Partial<Tenant>): Promise<Tenant> {
    const tenant = this.tenantRepository.create(data);
    return this.tenantRepository.save(tenant);
  }

  async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const tenant = await this.tenantRepository.preload({ id, ...data });
    if (!tenant) {
      throw new NotFoundException(`Tenant con ID ${id} no encontrado`);
    }
    return this.tenantRepository.save(tenant);
  }
}
