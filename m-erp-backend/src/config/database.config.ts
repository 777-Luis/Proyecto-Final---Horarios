import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get<string>('DB_USER'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false, // Usaremos migraciones
  logging: true,
  // RLS (Row Level Security) requiere que la sesión/transacción de PostgreSQL se configure con el usuario actual.
  // Esto se manejará en una capa de repositorio o servicio base que agrupe las transacciones.
});
