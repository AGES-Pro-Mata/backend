import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  onModuleInit() {
    this.logger.log(`Connected to ${process.env.DATABASE_URL} database`);
  }
}
