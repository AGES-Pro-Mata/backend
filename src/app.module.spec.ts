/* eslint-disable @typescript-eslint/unbound-method */

import 'reflect-metadata';
import { AppModule } from './app.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UserModule } from './user/user.module';
import { MailModule } from './mail/mail.module';
import { ReservationModule } from './reservation/reservation.module';
import { RequestsModule } from './requests/requests.module';
import { ExperienceModule } from './experience/experience.module';
import { ObfuscateModule } from './obfuscate/obfuscate.module';
import { HighlightModule } from './highlight/highlight.module';
import { ProfessorModule } from './professor/professor.module';
import { StorageModule } from './storage/storage.module';
import { ReservationController } from './reservation/reservation.controller';
import { ReservationService } from './reservation/reservation.service';
import { RoleGuard } from './auth/role/role.guard';
import { DatabaseExceptionFilter } from './database/database.filter';
import { ZodValidationPipe } from 'nestjs-zod';

describe('AppModule', () => {
  it('should be defined', () => {
    expect(AppModule).toBeDefined();
  });

  it('should have expected imports', () => {
    const imports = Reflect.getMetadata('imports', AppModule) as any[];

    expect(imports).toEqual(
      expect.arrayContaining([
        DatabaseModule,
        AuthModule,
        AnalyticsModule,
        UserModule,
        MailModule,
        ReservationModule,
        RequestsModule,
        ExperienceModule,
        ObfuscateModule,
        HighlightModule,
        ProfessorModule,
        StorageModule,
      ]),
    );
  });

  it('should register expected controllers', () => {
    const controllers = Reflect.getMetadata('controllers', AppModule) as any[];

    expect(controllers).toEqual(expect.arrayContaining([AppController, ReservationController]));
  });

  it('should register global providers and services', () => {
    const providers = Reflect.getMetadata('providers', AppModule) as any[];

    expect(providers).toEqual(expect.arrayContaining([AppService, ReservationService]));

    expect(providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ provide: expect.anything(), useClass: RoleGuard }),
        expect.objectContaining({ provide: expect.anything(), useClass: ZodValidationPipe }),
        expect.objectContaining({ provide: expect.anything(), useClass: DatabaseExceptionFilter }),
      ]),
    );
  });
});
