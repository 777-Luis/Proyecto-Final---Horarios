import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitudCambio } from '../domain/solicitud-cambio.entity';
import { Notificacion } from '../domain/notificacion.entity';
import { Usuario } from '../../erp-users/domain/usuario.entity';
import { NotificacionesService } from '../application/notificaciones.service';
import { NotificacionesController } from './controllers/notificaciones.controller';
import { SolicitudesService } from '../application/solicitudes.service';
import { SolicitudesController } from './controllers/solicitudes.controller';
import { ChronogestSchedulesModule } from '../../chronogest-schedules/infrastructure/chronogest-schedules.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SolicitudCambio, Notificacion, Usuario]),
    ChronogestSchedulesModule
  ],
  controllers: [NotificacionesController, SolicitudesController],
  providers: [NotificacionesService, SolicitudesService],
  exports: [NotificacionesService],
})
export class ChronogestRequestsModule {}
