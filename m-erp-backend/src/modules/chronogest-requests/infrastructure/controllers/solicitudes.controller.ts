import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { SolicitudesService } from '../../application/solicitudes.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly service: SolicitudesService) {}

  @Roles('Administrador', 'Instructor', 'Lider_Area')
  @Get()
  async findAll(@Req() req: any) {
    const userId = req.user.userId;
    const role = req.user.role;
    const estado = req.query.estado as string | undefined;
    return this.service.findAll(userId, role, estado);
  }

  @Roles('Instructor')
  @Post()
  async createSolicitud(@Body() body: any, @Req() req: any) {
    const { instructor_id, tipo_solicitud, descripcion, detalles_propuestos } = body;
    const liderUserId = req.user.userId;
    return this.service.createDirectByLider(instructor_id, liderUserId, tipo_solicitud, descripcion, detalles_propuestos);
  }

  @Roles('Instructor')
  @Patch(':id/reenviar')
  async reenviarAdmin(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.service.setEnviarAdmin(id, userId);
  }

  @Roles('Administrador')
  @Patch(':id/responder')
  async responderAdmin(@Param('id') id: string, @Body() body: any) {
    const { aprobado, observaciones } = body;
    return this.service.resolverAdmin(id, aprobado, observaciones);
  }
}
