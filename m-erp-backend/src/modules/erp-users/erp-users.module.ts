import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Persona } from './domain/persona.entity';
import { Rol } from './domain/rol.entity';
import { Credencial } from './domain/credencial.entity';
import { Aplicativo } from './domain/aplicativo.entity';
import { Usuario } from './domain/usuario.entity';
import { Acceso } from './domain/acceso.entity';
import { Permiso } from './domain/permiso.entity';
import { Curso } from '../erp-academics/domain/curso.entity';
import { Matricula } from '../erp-academics/domain/matricula.entity';
import { Municipio } from '../erp-locations/domain/municipio.entity';
import { Area } from '../erp-centers/domain/area.entity';
import { UsersController } from './infrastructure/controllers/users.controller';
import { UsersService } from './application/users.service';
import { ExcelUploadService } from './application/excel-upload.service';
import { SeedAdminController } from './infrastructure/controllers/seed-admin.controller';
import { SystemConfigService } from './application/system-config.service';
import { AplicativosController, AccesosController } from './infrastructure/controllers/system-config.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Persona,
      Rol,
      Credencial,
      Aplicativo,
      Usuario,
      Acceso,
      Permiso,
      Municipio,
      Curso,
      Matricula,
      Area,
    ]),
  ],
  controllers: [UsersController, SeedAdminController, AplicativosController, AccesosController],
  providers: [UsersService, ExcelUploadService, SystemConfigService],
})
export class ErpUsersModule {}
