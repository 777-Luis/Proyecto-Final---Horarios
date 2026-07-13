import { NestFactory } from '@nestjs/core';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from './app.module';

async function bootstrap() {
  // Must run before any application context (DataSource, repositories) is created,
  // so that @InjectRepository()-bound repositories can transparently join the
  // per-request transaction started by TenantInterceptor.
  initializeTransactionalContext();
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api/erp/v1');
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
