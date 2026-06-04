import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { MatriculasService } from '../../application/matriculas.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('matriculas')
export class MatriculasController {
  constructor(private readonly matriculasService: MatriculasService) {}

  @Roles('Administrador')
  @Post()
  async createMatricula(@Body() data: { usuario_id: string; curso_id: string }) {
    return this.matriculasService.createMatricula(data.usuario_id, data.curso_id);
  }

  @Roles('Administrador', 'Instructor', 'Aprendiz')
  @Get('aprendiz/:usuario_id')
  async getMatriculaByUsuario(@Param('usuario_id') usuario_id: string) {
    return this.matriculasService.getMatriculaByUsuario(usuario_id);
  }
}
