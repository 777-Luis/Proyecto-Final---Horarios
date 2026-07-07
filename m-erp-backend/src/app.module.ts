import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { DatabaseModule } from './shared/database/database.module';
import { ErpLocationsModule } from './modules/erp-locations/erp-locations.module';
import { ErpUsersModule } from './modules/erp-users/erp-users.module';
import { ErpAppsModule } from './modules/erp-apps/erp-apps.module';
import { ErpCentersModule } from './modules/erp-centers/erp-centers.module';
import { ErpAcademicsModule } from './modules/erp-academics/erp-academics.module';
import { ChronogestSchedulesModule } from './modules/chronogest-schedules/infrastructure/chronogest-schedules.module';
import { ChronogestRequestsModule } from './modules/chronogest-requests/infrastructure/chronogest-requests.module';
import { AuthModule } from './modules/auth/infrastructure/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TenantInterceptor } from './shared/tenant/infrastructure/interceptors/tenant.interceptor';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: 'localhost',
            port: 6379,
          },
          ttl: 1800000, // 1800 seconds (cache-manager-redis-yet uses milliseconds in v5, wait, nestjs uses milliseconds now in v5) Let's just pass 1800000 for 1800s. Wait, if it's cache-manager v5, TTL is in milliseconds. 1800 * 1000 = 1800000.
        }),
      }),
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    ErpLocationsModule,
    ErpUsersModule,
    ErpAppsModule,
    ErpCentersModule,
    ErpAcademicsModule,
    ChronogestSchedulesModule,
    ChronogestRequestsModule,
    AuthModule,
    JwtModule.register({}),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule { }
