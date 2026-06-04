import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Programa } from './domain/programa.entity';
import { Curso } from './domain/curso.entity';
import { Matricula } from './domain/matricula.entity';
import { Sede } from '../erp-centers/domain/sede.entity';
import { CentroFormacion } from '../erp-centers/domain/centro-formacion.entity';
import { Area } from '../erp-centers/domain/area.entity';
import { Persona } from '../erp-users/domain/persona.entity';
import { Usuario } from '../erp-users/domain/usuario.entity';
import { AcademicsSeedService } from './application/academics-seed.service';
import { AcademicsSeedController } from './infrastructure/controllers/academics-seed.controller';
import { ProgramasService } from './application/programas.service';
import { ProgramasController } from './infrastructure/controllers/programas.controller';
import { CursosService } from './application/cursos.service';
import { CursosController } from './infrastructure/controllers/cursos.controller';
import { MatriculasService } from './application/matriculas.service';
import { MatriculasController } from './infrastructure/controllers/matriculas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Programa, Curso, Matricula, Sede, Area, CentroFormacion, Persona, Usuario])],
  controllers: [AcademicsSeedController, ProgramasController, CursosController, MatriculasController],
  providers: [AcademicsSeedService, ProgramasService, CursosService, MatriculasService],
})
export class ErpAcademicsModule {}
