import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from '../application/auth.service';
import { AuthController } from './controllers/auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

import { Usuario } from '../../erp-users/domain/usuario.entity';
import { Credencial } from '../../erp-users/domain/credencial.entity';
import { Acceso } from '../../erp-users/domain/acceso.entity';
import { Aplicativo } from '../../erp-users/domain/aplicativo.entity';
import { Tenant } from '../../erp-centers/domain/entities/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Credencial, Acceso, Aplicativo, Tenant]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'super_secret',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1h',
        } as any,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
