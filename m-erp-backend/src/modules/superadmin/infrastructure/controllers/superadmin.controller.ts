import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { SuperadminService } from '../../application/superadmin.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../../auth/infrastructure/guards/superadmin.guard';

@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('superadmin')
export class SuperadminController {
  constructor(private readonly superadminService: SuperadminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.superadminService.getDashboardStats();
  }

  @Get('sedes')
  async getSedes() {
    return this.superadminService.getSedes();
  }

  @Post('sedes')
  async createSede(@Body() body: any) {
    return this.superadminService.createSede(body);
  }

  @Patch('sedes/:id')
  async updateSede(@Param('id') id: string, @Body() body: any) {
    return this.superadminService.updateSede(id, body);
  }

  @Delete('sedes/:id')
  async deleteSede(@Param('id') id: string) {
    return this.superadminService.deleteSede(id);
  }

  @Get('usuarios')
  async getUsuarios() {
    return this.superadminService.getUsuarios();
  }

  @Get('reportes')
  async getReportes() {
    return this.superadminService.getReportes();
  }
}
