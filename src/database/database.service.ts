import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  Reservation: any;
  Requests: any;
  RequestType: any;

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log(`Connected to the database`);
    } catch (e) {
      this.logger.fatal(`Failed to connected to the database: ${e}`);
      throw e;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log(`Disconnected to ${process.env.DATABASE_URL} database`);
  }
}
