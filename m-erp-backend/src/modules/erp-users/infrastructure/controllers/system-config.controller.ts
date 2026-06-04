import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { SystemConfigService } from '../../application/system-config.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('aplicativos')
export class AplicativosController {
  constructor(private readonly systemService: SystemConfigService) {}

  @Roles('Administrador')
  @Get()
  async findAll() {
    return this.systemService.getAplicativos();
  }

  @Roles('Administrador')
  @Post()
  async create(@Body() data: any) {
    return this.systemService.createAplicativo(data);
  }

  @Roles('Administrador')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.systemService.updateAplicativo(id, data);
  }

  @Roles('Administrador')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.systemService.deleteAplicativo(id);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accesos')
export class AccesosController {
  constructor(private readonly systemService: SystemConfigService) {}

  @Roles('Administrador')
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('aplicativo_id') aplicativo_id?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.systemService.getAccesos({
      search,
      aplicativo_id,
      start_date,
      end_date,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  }
}
