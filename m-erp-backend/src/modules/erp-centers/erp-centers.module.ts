import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CentroFormacion } from './domain/centro-formacion.entity';
import { Sede } from './domain/sede.entity';
import { Area } from './domain/area.entity';
import { Ambiente } from './domain/ambiente.entity';
import { Tenant } from './domain/entities/tenant.entity';
import { Curso } from '../erp-academics/domain/curso.entity';
import { Programa } from '../erp-academics/domain/programa.entity';
import { Usuario } from '../erp-users/domain/usuario.entity';
import { AreasService } from './application/areas.service';
import { AreasController } from './infrastructure/controllers/areas.controller';
import { AmbientesService } from './application/ambientes.service';
import { AmbientesController } from './infrastructure/controllers/ambientes.controller';
import { CentersService } from './application/centers.service';
import { CentrosController, SedesController } from './infrastructure/controllers/centers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CentroFormacion, Sede, Area, Ambiente, Tenant, Curso, Programa, Usuario])],
  controllers: [AreasController, AmbientesController, CentrosController, SedesController],
  providers: [AreasService, AmbientesService, CentersService],
})
export class ErpCentersModule {}
