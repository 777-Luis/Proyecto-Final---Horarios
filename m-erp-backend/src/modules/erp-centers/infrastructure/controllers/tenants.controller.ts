import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { TenantsService } from '../../application/tenants.service';
import { Tenant } from '../../domain/entities/tenant.entity';

@Controller('api/erp/v1/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  async findAll() {
    return this.tenantsService.findAll();
  }

  @Post()
  async create(@Body() data: Partial<Tenant>) {
    return this.tenantsService.create(data);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Tenant>) {
    return this.tenantsService.update(id, data);
  }
}
