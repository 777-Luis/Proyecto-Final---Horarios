import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'erp_user',
  password: process.env.DB_PASSWORD || 'erp_password',
  database: process.env.DB_NAME || 'erpdblocal',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/modules/**/infrastructure/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
});
