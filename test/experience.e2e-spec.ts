import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { ExperienceModule } from '../src/experience/experience.module';
import { DatabaseService } from '../src/database/database.service';
import { StorageService } from '../src/storage/storage.service';

describe("ExperienceController (e2e)", () => {
    let app: INestApplication;

    const mockDatabaseService = {
        experience: {
            findMany: jest.fn().mockResolvedValue([]),
            create: jest.fn().mockResolvedValue({ id: "1", title: "Test Experience" }),
            update: jest.fn(),
            delete: jest.fn(),
        },
        image: {
            findUnique: jest.fn(),
        },
    };

    const mockStorageService = {
        UploadedFile: jest.fn().mockResolvedValue({url: ""}),
    };

    beforeEach(async () => {
        const moduleFixure : TestingModule = await Test.createTestingModule({
            imports: [ExperienceModule],
        })
        .overrideProvider(DatabaseService)
        .useValue(mockDatabaseService)
        .overrideProvider(StorageService)
        .useValue(mockStorageService)
        .compile();
        app = moduleFixure.createNestApplication();
        await app.init();
    });

    it("/experience (GET)", async () => {
        return request(app.getHttpServer())
            .get("/experience")
            .expect(200)
            .expect({
                page: undefined,
                limit: undefined,
                total: 0,
                itens: []
            });
    });
});