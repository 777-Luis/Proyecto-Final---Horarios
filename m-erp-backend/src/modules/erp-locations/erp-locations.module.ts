import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Departamento } from './domain/departamento.entity';
import { Municipio } from './domain/municipio.entity';
import { DepartamentoController } from './interfaces/controllers/departamento.controller';
import { CreateDepartamentoAction } from './application/actions/create-departamento.action';
import { LocationsSeedService } from './application/locations-seed.service';
import { LocationsService } from './application/locations.service';
import { DepartamentosController, MunicipiosController } from './infrastructure/controllers/locations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Departamento, Municipio])],
  controllers: [DepartamentoController, DepartamentosController, MunicipiosController],
  providers: [CreateDepartamentoAction, LocationsSeedService, LocationsService],
})
export class ErpLocationsModule {}
