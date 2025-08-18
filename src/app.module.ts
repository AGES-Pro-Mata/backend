import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { getEnvFile } from './config/env.utils';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: getEnvFile(),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
