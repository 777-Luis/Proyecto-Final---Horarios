import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'erp_user',
  password: 'erp_password',
  database: 'erpdblocal',
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function clearSolicitudes() {
  await AppDataSource.initialize();
  await AppDataSource.query('TRUNCATE TABLE solicitudes_cambio CASCADE;');
  console.log('Truncated solicitudes_cambio');
  await AppDataSource.destroy();
}

clearSolicitudes().catch(console.error);
