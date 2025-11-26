/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs';
import nodemailer from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('node:fs', () => ({
  __esModule: true,
  readFileSync: jest.fn(),
}));

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
}));

describe('MailService', () => {
  let service: MailService;
  let configService: any;
  let mockedNodemailer: jest.Mocked<typeof nodemailer>;
  let sendMailMock: jest.Mock;

  beforeEach(async () => {
    mockedNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;
    mockedNodemailer.createTransport.mockReset();
    sendMailMock = jest.fn();
    mockedNodemailer.createTransport.mockReturnValue({
      sendMail: sendMailMock,
    });

    const configValues: Record<string, string> = {
      MAIL_HOST: 'smtp.example.com',
      MAIL_PORT: '587',
      MAIL_USER: 'user@example.com',
      MAIL_PASS: 'secret',
      MAIL_FROM_NAME: 'Pró-Mata',
      MAIL_FROM: 'no-reply@example.com',
    };

    const mockConfigService = {
      get: jest.fn((key: string) => configValues[key]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get(ConfigService);
  });

  describe('constructor', () => {
    it('should create transporter with configuration from ConfigService', () => {
      expect(mockedNodemailer.createTransport).toHaveBeenCalledTimes(1);
      expect(mockedNodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'user@example.com',
          pass: 'secret',
        },
      });
      expect(configService.get).toHaveBeenCalledWith('MAIL_HOST');
      expect(configService.get).toHaveBeenCalledWith('MAIL_PORT');
      expect(configService.get).toHaveBeenCalledWith('MAIL_USER');
      expect(configService.get).toHaveBeenCalledWith('MAIL_PASS');
    });
  });

  describe('sendMail', () => {
    it('should send mail using transporter with correct parameters', async () => {
      const to = 'recipient@example.com';
      const subject = 'Test Subject';
      const text = 'Plain text body';
      const html = '<p>HTML body</p>';

      await service.sendMail(to, subject, text, html);

      expect(sendMailMock).toHaveBeenCalledTimes(1);
      const mailOptions = sendMailMock.mock.calls[0][0];
      expect(mailOptions).toEqual({
        from: '"Pró-Mata" <no-reply@example.com>',
        to,
        subject,
        text,
        html,
      });
    });
  });

  describe('sendTemplateMail', () => {
    it('should compile template and send email with rendered HTML', async () => {
      const to = 'template@example.com';
      const subject = 'Welcome';
      const templateName = 'welcome-email';
      const context = { name: 'John Doe' };
      const readFileSyncMock = fs.readFileSync as unknown as jest.Mock;
      readFileSyncMock.mockReturnValue('Hello {{name}}');

      await service.sendTemplateMail(to, subject, templateName, context);

      expect(readFileSyncMock).toHaveBeenCalledWith(
        'dist/src/mail/templates/welcome-email.hbs',
        'utf-8',
      );

      expect(sendMailMock).toHaveBeenCalledTimes(1);
      const mailOptions = sendMailMock.mock.calls[0][0];
      expect(mailOptions.to).toBe(to);
      expect(mailOptions.subject).toBe(subject);
      expect(mailOptions.text).toBe(subject);
      expect(mailOptions.html).toBe('Hello John Doe');

      readFileSyncMock.mockReset();
    });
  });
});
