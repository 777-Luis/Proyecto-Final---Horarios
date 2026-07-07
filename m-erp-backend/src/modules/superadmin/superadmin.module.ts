import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperadminController } from './infrastructure/controllers/superadmin.controller';
import { SuperadminService } from './application/superadmin.service';
import { Tenant } from '../erp-centers/domain/entities/tenant.entity';
import { Usuario } from '../erp-users/domain/usuario.entity';
import { Persona } from '../erp-users/domain/persona.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Usuario, Persona])],
  controllers: [SuperadminController],
  providers: [SuperadminService],
})
export class SuperadminModule {}
