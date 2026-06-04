import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Horario } from '../domain/horario.entity';
import { HorarioDetalle } from '../domain/horario-detalle.entity';
import { HorariosService } from '../application/horarios.service';
import { HorariosController } from './controllers/horarios.controller';
import { HttpModule } from '@nestjs/axios';
import { RegistroClase } from '../domain/entities/registro-clase.entity';
import { Ambiente } from '../../erp-centers/domain/ambiente.entity';
import { RegistroClaseRepository } from './repositories/registro-clase.repository';
import { RegistroClaseAction } from '../application/actions/registro-clase.action';
import { RegistroClaseCronService } from '../application/cron/registro-clase.cron.service';
import { RegistroClaseController } from '../interfaces/controllers/registro-clase.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Horario, HorarioDetalle, RegistroClase, Ambiente]),
    HttpModule
  ],
  controllers: [RegistroClaseController, HorariosController],
  providers: [
    HorariosService,
    RegistroClaseAction,
    RegistroClaseCronService,
    {
      provide: 'IRegistroClaseRepository',
      useClass: RegistroClaseRepository,
    }
  ],
  exports: [HorariosService]
})
export class ChronogestSchedulesModule {}
