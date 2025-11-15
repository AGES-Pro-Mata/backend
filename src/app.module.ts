import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { RoleGuard } from './auth/role/role.guard';
import { AnalyticsModule } from './analytics/analytics.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { UserModule } from './user/user.module';
import { ReservationService } from './reservation/reservation.service';
import { ReservationController } from './reservation/reservation.controller';
import { ReservationModule } from './reservation/reservation.module';
import { ExperienceModule } from './experience/experience.module';
import { ObfuscateModule } from './obfuscate/obfuscate.module';
import { DatabaseExceptionFilter } from './database/database.filter';
import { HighlightModule } from './highlight/highlight.module';
import { MailModule } from './mail/mail.module';
import { RequestsModule } from './requests/requests.module';

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
    RequestsModule,
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
