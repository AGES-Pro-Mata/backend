import { CreateTableCommand, DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { tables } from './tables.config';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  private readonly client = new DynamoDBClient({
    region: process.env.DATABASE_REGION,
    endpoint: process.env.DATABASE_URL,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.SECRET_ACCESS_KEY ?? '',
    },
  });

  public readonly docClient = DynamoDBDocumentClient.from(this.client);

  async onModuleInit() {
    await this.createTables();
  }

  private async createTables() {
    const existing = await this.client.send(new ListTablesCommand({}));
    const existingNames = new Set(existing.TableNames ?? []);

    for (const [idx, def] of tables.entries()) {
      if (!def.TableName) {
        this.logger.error(`Table [${idx}] don't have a \`TableName\``);
        continue;
      }

      if (existingNames.has(def.TableName)) {
        this.logger.log(`Table ${def.TableName} already exists`);
        continue;
      }

      try {
        await this.client.send(new CreateTableCommand(def));
        this.logger.log(`Table ${def.TableName} created`);
      } catch (err) {
        this.logger.error(`Error creating ${def.TableName}`, err as Error);
      }
    }
  }
}
