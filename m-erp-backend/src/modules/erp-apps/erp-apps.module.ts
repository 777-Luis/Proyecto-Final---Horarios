import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Modulo } from './domain/modulo.entity';
import { Servicio } from './domain/servicio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Modulo, Servicio])],
})
export class ErpAppsModule {}
