import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { NotificacionesService } from '../../application/notificaciones.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard) // Accessible to any authenticated role
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly service: NotificacionesService) {}

  @Get()
  async getMisNotificaciones(@Req() req: any) {
    const userId = req.user.userId;
    return this.service.findMisNotificaciones(userId);
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.service.markAsRead(id, userId);
  }
}
