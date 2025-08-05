# 🚀 Pro-Mata Backend Boilerplate - NestJS + DynamoDB

Um boilerplate robusto e moderno para APIs REST com NestJS, espelhando a qualidade e organização do frontend React.

## 🎯 Por que essa Stack é Perfeita?

### **Sinergia com o Frontend**

Com NestJS (TypeScript) e React (TypeScript), você tem **consistência total** de linguagem e paradigmas. Isso significa:

- Reutilização de tipos entre frontend e backend
- Menor curva de aprendizado para a equipe
- Mesmas ferramentas de build e desenvolvimento
- Debugging mais eficiente

### **DynamoDB + NestJS = Performance**

DynamoDB oferece escalabilidade horizontal e latência baixa, perfeito para aplicações modernas. Com NestJS, você mantém a organização enterprise que o projeto merece.

## 🏗️ Arquitetura & Stack

### **Core Technologies**

- **Framework**: NestJS 10+ (Node.js + TypeScript)
- **Runtime**: Node.js 20 LTS
- **Database**: AWS DynamoDB (NoSQL)
- **ORM**: DynamoDB Document Client + Custom abstraction
- **Authentication**: JWT + Passport.js
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI 3
- **Testing**: Jest + Supertest

### **Infraestrutura**

- **Containerization**: Docker + Docker Compose
- **Cache**: Redis (para sessões e cache)
- **File Storage**: AWS S3
- **Monitoring**: CloudWatch + Custom metrics
- **Logging**: Winston + Structured JSON

## 📁 Estrutura do Projeto

```plaintext
backend/
├── src/
│   ├── main.ts                        # Application entry point
│   ├── app.module.ts                  # Root module
│   │
│   ├── common/                        # Shared utilities
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   ├── api-response.decorator.ts
│   │   │   └── validate-uuid.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   ├── throttle.guard.ts
│   │   │   └── api-key.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   ├── timeout.interceptor.ts
│   │   │   └── cache.interceptor.ts
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   ├── validation-exception.filter.ts
│   │   │   └── dynamodb-exception.filter.ts
│   │   ├── pipes/
│   │   │   ├── validation.pipe.ts
│   │   │   ├── transform.pipe.ts
│   │   │   └── parse-uuid.pipe.ts
│   │   ├── middleware/
│   │   │   ├── logger.middleware.ts
│   │   │   ├── cors.middleware.ts
│   │   │   └── rate-limit.middleware.ts
│   │   ├── types/
│   │   │   ├── api-response.type.ts
│   │   │   ├── pagination.type.ts
│   │   │   ├── sort.type.ts
│   │   │   └── filter.type.ts
│   │   ├── utils/
│   │   │   ├── crypto.util.ts
│   │   │   ├── date.util.ts
│   │   │   ├── string.util.ts
│   │   │   ├── validation.util.ts
│   │   │   └── dynamodb.util.ts
│   │   ├── constants/
│   │   │   ├── app.constants.ts
│   │   │   ├── error-codes.constants.ts
│   │   │   ├── table-names.constants.ts
│   │   │   └── jwt.constants.ts
│   │   └── exceptions/
│   │       ├── business.exception.ts
│   │       ├── resource-not-found.exception.ts
│   │       ├── duplicate-resource.exception.ts
│   │       ├── invalid-request.exception.ts
│   │       └── unauthorized-access.exception.ts
│   │
│   ├── config/                        # Configuration modules
│   │   ├── configuration.ts           # Main config
│   │   ├── database.config.ts         # DynamoDB config
│   │   ├── auth.config.ts             # JWT & Passport config
│   │   ├── aws.config.ts              # AWS services config
│   │   ├── redis.config.ts            # Cache config
│   │   ├── swagger.config.ts          # API documentation
│   │   └── validation.config.ts       # Global validation rules
│   │
│   ├── database/                      # Database layer
│   │   ├── dynamodb.module.ts         # DynamoDB module
│   │   ├── dynamodb.service.ts        # Base DynamoDB service
│   │   ├── repositories/              # Repository pattern
│   │   │   ├── base.repository.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── reservation.repository.ts
│   │   │   ├── accommodation.repository.ts
│   │   │   ├── activity.repository.ts
│   │   │   └── payment.repository.ts
│   │   ├── schemas/                   # DynamoDB table schemas
│   │   │   ├── user.schema.ts
│   │   │   ├── reservation.schema.ts
│   │   │   ├── accommodation.schema.ts
│   │   │   ├── activity.schema.ts
│   │   │   └── payment.schema.ts
│   │   ├── migrations/                # Table creation scripts
│   │   │   ├── 001-create-users-table.ts
│   │   │   ├── 002-create-reservations-table.ts
│   │   │   ├── 003-create-accommodations-table.ts
│   │   │   └── 004-create-indexes.ts
│   │   └── seeds/                     # Initial data
│   │       ├── dev/
│   │       └── test/
│   │
│   ├── modules/                       # Feature modules
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── local.strategy.ts
│   │   │   │   └── refresh-token.strategy.ts
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   ├── refresh-token.dto.ts
│   │   │   │   ├── forgot-password.dto.ts
│   │   │   │   └── reset-password.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── token.entity.ts
│   │   │   │   └── refresh-token.entity.ts
│   │   │   └── interfaces/
│   │   │       ├── jwt-payload.interface.ts
│   │   │       └── auth-response.interface.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   ├── update-user.dto.ts
│   │   │   │   ├── update-profile.dto.ts
│   │   │   │   ├── change-password.dto.ts
│   │   │   │   └── user-search.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── user.entity.ts
│   │   │   │   ├── user-profile.entity.ts
│   │   │   │   └── user-preferences.entity.ts
│   │   │   ├── enums/
│   │   │   │   ├── user-role.enum.ts
│   │   │   │   ├── user-status.enum.ts
│   │   │   │   └── user-type.enum.ts
│   │   │   └── interfaces/
│   │   │       ├── user.interface.ts
│   │   │       └── user-response.interface.ts
│   │   │
│   │   ├── reservations/
│   │   │   ├── reservations.module.ts
│   │   │   ├── reservations.controller.ts
│   │   │   ├── reservations.service.ts
│   │   │   ├── availability.service.ts
│   │   │   ├── pricing.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-reservation.dto.ts
│   │   │   │   ├── update-reservation.dto.ts
│   │   │   │   ├── cancel-reservation.dto.ts
│   │   │   │   ├── reservation-search.dto.ts
│   │   │   │   ├── availability-check.dto.ts
│   │   │   │   └── pricing-calculation.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── reservation.entity.ts
│   │   │   │   ├── reservation-item.entity.ts
│   │   │   │   ├── reservation-history.entity.ts
│   │   │   │   └── availability.entity.ts
│   │   │   ├── enums/
│   │   │   │   ├── reservation-status.enum.ts
│   │   │   │   ├── reservation-type.enum.ts
│   │   │   │   └── cancellation-reason.enum.ts
│   │   │   └── interfaces/
│   │   │       ├── reservation.interface.ts
│   │   │       ├── availability.interface.ts
│   │   │       └── pricing.interface.ts
│   │   │
│   │   ├── accommodations/
│   │   │   ├── accommodations.module.ts
│   │   │   ├── accommodations.controller.ts
│   │   │   ├── accommodations.service.ts
│   │   │   ├── search.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-accommodation.dto.ts
│   │   │   │   ├── update-accommodation.dto.ts
│   │   │   │   ├── accommodation-search.dto.ts
│   │   │   │   └── accommodation-filter.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── accommodation.entity.ts
│   │   │   │   ├── accommodation-type.entity.ts
│   │   │   │   ├── amenity.entity.ts
│   │   │   │   └── room.entity.ts
│   │   │   ├── enums/
│   │   │   │   ├── accommodation-category.enum.ts
│   │   │   │   ├── amenity-type.enum.ts
│   │   │   │   └── room-type.enum.ts
│   │   │   └── interfaces/
│   │   │       ├── accommodation.interface.ts
│   │   │       └── search-criteria.interface.ts
│   │   │
│   │   ├── activities/
│   │   │   ├── activities.module.ts
│   │   │   ├── activities.controller.ts
│   │   │   ├── activities.service.ts
│   │   │   ├── scheduling.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-activity.dto.ts
│   │   │   │   ├── update-activity.dto.ts
│   │   │   │   ├── schedule-activity.dto.ts
│   │   │   │   └── activity-search.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── activity.entity.ts
│   │   │   │   ├── activity-schedule.entity.ts
│   │   │   │   ├── activity-category.entity.ts
│   │   │   │   └── activity-booking.entity.ts
│   │   │   ├── enums/
│   │   │   │   ├── activity-type.enum.ts
│   │   │   │   ├── difficulty-level.enum.ts
│   │   │   │   └── weather-dependency.enum.ts
│   │   │   └── interfaces/
│   │   │       ├── activity.interface.ts
│   │   │       └── schedule.interface.ts
│   │   │
│   │   ├── payments/
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.controller.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── processors/
│   │   │   │   ├── stripe.processor.ts
│   │   │   │   ├── paypal.processor.ts
│   │   │   │   └── pix.processor.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-payment.dto.ts
│   │   │   │   ├── process-payment.dto.ts
│   │   │   │   ├── refund-payment.dto.ts
│   │   │   │   └── payment-webhook.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── payment.entity.ts
│   │   │   │   ├── payment-method.entity.ts
│   │   │   │   ├── transaction.entity.ts
│   │   │   │   └── refund.entity.ts
│   │   │   ├── enums/
│   │   │   │   ├── payment-status.enum.ts
│   │   │   │   ├── payment-method.enum.ts
│   │   │   │   ├── currency.enum.ts
│   │   │   │   └── transaction-type.enum.ts
│   │   │   └── interfaces/
│   │   │       ├── payment.interface.ts
│   │   │       ├── payment-processor.interface.ts
│   │   │       └── webhook.interface.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── providers/
│   │   │   │   ├── email.provider.ts
│   │   │   │   ├── sms.provider.ts
│   │   │   │   └── push.provider.ts
│   │   │   ├── templates/
│   │   │   │   ├── email-templates.service.ts
│   │   │   │   └── sms-templates.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── send-email.dto.ts
│   │   │   │   ├── send-sms.dto.ts
│   │   │   │   └── send-push.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── notification.entity.ts
│   │   │   │   ├── notification-template.entity.ts
│   │   │   │   └── notification-log.entity.ts
│   │   │   ├── enums/
│   │   │   │   ├── notification-type.enum.ts
│   │   │   │   ├── notification-channel.enum.ts
│   │   │   │   └── notification-status.enum.ts
│   │   │   └── interfaces/
│   │   │       ├── notification.interface.ts
│   │   │       └── provider.interface.ts
│   │   │
│   │   ├── files/
│   │   │   ├── files.module.ts
│   │   │   ├── files.controller.ts
│   │   │   ├── files.service.ts
│   │   │   ├── s3.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── upload-file.dto.ts
│   │   │   │   ├── file-metadata.dto.ts
│   │   │   │   └── presigned-url.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── file.entity.ts
│   │   │   │   └── file-metadata.entity.ts
│   │   │   ├── enums/
│   │   │   │   ├── file-type.enum.ts
│   │   │   │   └── file-status.enum.ts
│   │   │   └── interfaces/
│   │   │       ├── file.interface.ts
│   │   │       └── storage.interface.ts
│   │   │
│   │   ├── reports/
│   │   │   ├── reports.module.ts
│   │   │   ├── reports.controller.ts
│   │   │   ├── reports.service.ts
│   │   │   ├── generators/
│   │   │   │   ├── reservation-report.generator.ts
│   │   │   │   ├── financial-report.generator.ts
│   │   │   │   └── occupancy-report.generator.ts
│   │   │   ├── dto/
│   │   │   │   ├── report-request.dto.ts
│   │   │   │   ├── report-filter.dto.ts
│   │   │   │   └── export-options.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── report.entity.ts
│   │   │   │   └── report-schedule.entity.ts
│   │   │   ├── enums/
│   │   │   │   ├── report-type.enum.ts
│   │   │   │   ├── report-format.enum.ts
│   │   │   │   └── report-frequency.enum.ts
│   │   │   └── interfaces/
│   │   │       ├── report.interface.ts
│   │   │       └── generator.interface.ts
│   │   │
│   │   └── health/
│   │       ├── health.module.ts
│   │       ├── health.controller.ts
│   │       ├── health.service.ts
│   │       ├── indicators/
│   │       │   ├── dynamodb.indicator.ts
│   │       │   ├── redis.indicator.ts
│   │       │   └── s3.indicator.ts
│   │       └── interfaces/
│   │           └── health-check.interface.ts
│   │
│   └── shared/                        # Shared business logic
│       ├── aws/
│       │   ├── aws.module.ts
│       │   ├── dynamodb.service.ts
│       │   ├── s3.service.ts
│       │   ├── ses.service.ts
│       │   └── cloudwatch.service.ts
│       ├── cache/
│       │   ├── cache.module.ts
│       │   ├── redis.service.ts
│       │   └── cache.service.ts
│       ├── queue/
│       │   ├── queue.module.ts
│       │   ├── processors/
│       │   └── jobs/
│       └── metrics/
│           ├── metrics.module.ts
│           ├── metrics.service.ts
│           └── custom-metrics.ts
│
├── test/                              # Test files
│   ├── app.e2e-spec.ts
│   ├── auth.e2e-spec.ts
│   ├── users.e2e-spec.ts
│   ├── reservations.e2e-spec.ts
│   ├── fixtures/
│   │   ├── user.fixture.ts
│   │   ├── reservation.fixture.ts
│   │   └── accommodation.fixture.ts
│   ├── helpers/
│   │   ├── test.helper.ts
│   │   ├── dynamodb.helper.ts
│   │   └── auth.helper.ts
│   └── setup/
│       ├── jest.setup.ts
│       ├── test-db.setup.ts
│       └── aws-mock.setup.ts
│
├── scripts/                           # Utility scripts
│   ├── build.sh
│   ├── test.sh
│   ├── dev.sh
│   ├── prod.sh
│   ├── database/
│   │   ├── create-tables.ts
│   │   ├── seed-data.ts
│   │   ├── backup.ts
│   │   └── migrate.ts
│   ├── deployment/
│   │   ├── deploy-dev.sh
│   │   ├── deploy-prod.sh
│   │   └── rollback.sh
│   └── aws/
│       ├── setup-dynamodb.ts
│       ├── setup-s3.ts
│       └── setup-iam.ts
│
├── docker/
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── docker-compose.test.yml
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── cd-dev.yml
│       ├── cd-prod.yml
│       ├── security-scan.yml
│       └── performance-test.yml
│
├── docs/
│   ├── API.md
│   ├── SETUP.md
│   ├── TESTING.md
│   ├── DEPLOYMENT.md
│   ├── ARCHITECTURE.md
│   ├── DYNAMODB.md
│   └── AWS-SETUP.md
│
├── package.json
├── package-lock.json
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── .eslintrc.js
├── .prettierrc
├── jest.config.js
├── .env.example
├── .gitignore
├── README.md
└── LICENSE
```

## 🔧 Principais Configurações

### **Exemplo de Entity (DynamoDB)**

```typescript
// src/modules/users/entities/user.entity.ts
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../enums';

export class User {
  @ApiProperty({
    description: 'Unique user identifier',
    example: 'user#123e4567-e89b-12d3-a456-426614174000'
  })
  PK: string; // Partition Key: user#{uuid}

  @ApiProperty({
    description: 'Sort key for user data',
    example: 'USER'
  })
  SK: string; // Sort Key: USER

  @ApiProperty({
    description: 'User email address',
    example: 'joao.silva@email.com'
  })
  email: string;

  @ApiProperty({
    description: 'User full name',
    example: 'João Silva'
  })
  name: string;

  @ApiProperty({
    description: 'Encrypted password hash'
  })
  passwordHash: string;

  @ApiProperty({
    description: 'User role in the system',
    enum: UserRole
  })
  role: UserRole;

  @ApiProperty({
    description: 'Current user status',
    enum: UserStatus
  })
  status: UserStatus;

  @ApiProperty({
    description: 'User phone number',
    example: '+55 11 99999-9999'
  })
  phone?: string;

  @ApiProperty({
    description: 'User document (CPF)',
    example: '123.456.789-00'
  })
  document?: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-15'
  })
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Record creation timestamp'
  })
  createdAt: string;

  @ApiProperty({
    description: 'Record last update timestamp'
  })
  updatedAt: string;

  @ApiProperty({
    description: 'GSI1 partition key for email lookup',
    example: 'joao.silva@email.com'
  })
  GSI1PK: string; // email

  @ApiProperty({
    description: 'GSI1 sort key',
    example: 'USER'
  })
  GSI1SK: string; // USER

  @ApiProperty({
    description: 'GSI2 partition key for role-based queries',
    example: 'ADMIN'
  })
  GSI2PK: string; // role

  @ApiProperty({
    description: 'GSI2 sort key with timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  GSI2SK: string; // createdAt
}
```

### **Exemplo de Repository**

```typescript
// src/database/repositories/user.repository.ts
import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { User } from '../../modules/users/entities/user.entity';
import { CreateUserDto } from '../../modules/users/dto/create-user.dto';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  protected tableName = 'ProMata-Users';

  // Create user with proper DynamoDB structure
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const userId = this.generateId();
    const now = new Date().toISOString();
    
    const user: User = {
      PK: `user#${userId}`,
      SK: 'USER',
      GSI1PK: createUserDto.email,
      GSI1SK: 'USER',
      GSI2PK: createUserDto.role,
      GSI2SK: now,
      email: createUserDto.email,
      name: createUserDto.name,
      passwordHash: createUserDto.passwordHash,
      role: createUserDto.role,
      status: UserStatus.ACTIVE,
      phone: createUserDto.phone,
      document: createUserDto.document,
      dateOfBirth: createUserDto.dateOfBirth,
      createdAt: now,
      updatedAt: now,
    };

    await this.create(user);
    return user;
  }

  // Find user by email using GSI1
  async findByEmail(email: string): Promise<User | null> {
    const params = {
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :email AND GSI1SK = :sk',
      ExpressionAttributeValues: {
        ':email': email,
        ':sk': 'USER',
      },
    };

    const result = await this.query(params);
    return result.Items?.[0] as User || null;
  }

  // Find users by role using GSI2
  async findByRole(role: UserRole): Promise<User[]> {
    const params = {
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :role',
      ExpressionAttributeValues: {
        ':role': role,
      },
    };

    const result = await this.query(params);
    return result.Items as User[] || [];
  }

  // Update user with optimistic locking
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const pk = `user#${userId}`;
    const sk = 'USER';
    
    const updateExpression = this.buildUpdateExpression(updates);
    
    const params = {
      Key: { PK: pk, SK: sk },
      UpdateExpression: updateExpression.expression,
      ExpressionAttributeNames: updateExpression.names,
      ExpressionAttributeValues: {
        ...updateExpression.values,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW' as const,
    };

    const result = await this.update(params);
    return result.Attributes as User;
  }
}
```

### **Exemplo de Service**

```typescript
// src/modules/users/users.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../database/repositories/user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createUserDto.password, 12);

    // Create user
    const user = await this.userRepository.createUser({
      ...createUserDto,
      passwordHash,
    });

    // Remove password hash from response
    const { passwordHash: _, ...userResponse } = user;
    return userResponse as User;
  }

  async findAll(role?: UserRole): Promise<User[]> {
    if (role) {
      return this.userRepository.findByRole(role);
    }
    return this.userRepository.findAll();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findById(`user#${id}`);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash: _, ...userResponse } = user;
    return userResponse as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const existingUser = await this.findOne(id);
    
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.userRepository.findByEmail(updateUserDto.email);
      if (emailExists) {
        throw new ConflictException('Email already in use');
      }
    }

    const updates: Partial<User> = {
      ...updateUserDto,
      updatedAt: new Date().toISOString(),
    };

    // Update GSI keys if email changed
    if (updateUserDto.email) {
      updates.GSI1PK = updateUserDto.email;
    }

    const updatedUser = await this.userRepository.updateUser(id, updates);
    const { passwordHash: _, ...userResponse } = updatedUser;
    return userResponse as User;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.delete(`user#${id}`, 'USER');
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash: _, ...userResponse } = user;
    return userResponse as User;
  }
}
```

## 🎯 Vantagens desta Arquitetura

### **Performance e Escalabilidade**

DynamoDB oferece latência de milissegundos e escalabilidade automática. Com GSIs bem projetados, você tem queries eficientes para todos os casos de uso.

### **Type Safety Total**

TypeScript compartilhado entre frontend e backend elimina erros de comunicação e acelera o desenvolvimento.

### **Manutenibilidade Enterprise**

Estrutura modular do NestJS facilita a manutenção e expansão do sistema. Cada módulo é independente e testável.

### **DevOps Simplificado**

Node.js tanto no frontend quanto no backend significa ferramentas unificadas de CI/CD, mesmas versões de dependências, e deployment mais simples.

## 🚀 Próximos Passos

Esta estrutura estabelece uma base sólida que espelha a qualidade do frontend. Você tem:

1. **Organização clara** - Cada funcionalidade tem seu lugar
2. **Padrões consistentes** - DTOs, entities, enums organizados
3. **Testabilidade** - Estrutura preparada para testes robustos
4. **Documentação automática** - Swagger integrado
5. **Segurança** - JWT, guards, validações
6. **Performance** - DynamoDB + cache + otimizações

O próximo passo seria implementar os módulos específicos seguindo estes padrões, mantendo a consistência e qualidade em todo o projeto.
