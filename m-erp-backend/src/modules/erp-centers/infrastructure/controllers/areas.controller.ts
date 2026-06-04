import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AreasService } from '../../application/areas.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Roles('Administrador', 'Instructor')
  @Get()
  async findAll() {
    return this.areasService.findAll();
  }

  @Roles('Administrador', 'Instructor')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.areasService.findOne(id);
  }

  @Roles('Administrador', 'Instructor', 'Aprendiz')
  @Get(':id/programas')
  async findProgramas(@Param('id') id: string) {
    return this.areasService.findProgramas(id);
  }

  @Roles('Administrador')
  @Get(':id/instructores')
  async findInstructores(@Param('id') id: string) {
    // The id is intentionally ignored by the service per business rules.
    return this.areasService.findInstructores();
  }

  @Roles('Administrador')
  @Post()
  async create(@Body() data: any) {
    return this.areasService.create(data);
  }

  @Roles('Administrador')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.areasService.update(id, data);
  }

  @Roles('Administrador')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.areasService.delete(id);
  }
}
