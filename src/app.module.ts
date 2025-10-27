import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ZodValidationPipe } from 'nestjs-zod';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RoleGuard } from './auth/role/role.guard';
import { DatabaseExceptionFilter } from './database/database.filter';
import { DatabaseModule } from './database/database.module';
import { ExperienceModule } from './experience/experience.module';
import { HighlightModule } from './highlight/highlight.module';
import { ObfuscateModule } from './obfuscate/obfuscate.module';
import { ReservationController } from './reservation/reservation.controller';
import { ReservationModule } from './reservation/reservation.module';
import { MailModule } from './mail/mail.module';
import { ReservationService } from './reservation/reservation.service';
import { UserModule } from './user/user.module';
import { RequestModule } from './request/request.module';

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
    MailModule,
    ReservationModule,
    RequestModule,
    ExperienceModule,
    ObfuscateModule,
    HighlightModule,
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
    {
      provide: APP_FILTER,
      useClass: DatabaseExceptionFilter,
    },
    ReservationService,
  ],
})
export class AppModule {}
