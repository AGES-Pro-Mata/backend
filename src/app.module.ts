import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { RoleGuard } from './auth/role/role.guard';
import { AnalyticsModule } from './analytics/analytics.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { UserModule } from './user/user.module';
import { ReservationService } from './reservation/reservation.service';
import { ReservationController } from './reservation/reservation.controller';
import { ReservationModule } from './reservation/reservation.module';
import { ExperienceModule } from './experience/experience.module';
import { ObfuscateModule } from './obfuscate/obfuscate.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    JwtModule,
    AuthModule,
    AnalyticsModule,
    UserModule,
    ReservationModule,
    ExperienceModule,
    ObfuscateModule,
  ],
  controllers: [AppController, ReservationController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    ReservationService,
  ],
})
export class AppModule {}
