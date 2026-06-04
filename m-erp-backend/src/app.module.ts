import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
