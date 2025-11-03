import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Handlebars from 'handlebars';
import * as fs from 'node:fs';
import * as path from 'node:path';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;
  private templateCache = new Map<string, Handlebars.TemplateDelegate>();

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: Number(this.configService.get('MAIL_PORT')),
      secure: false,
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASS'),
      },
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    await this.transporter.sendMail({
      from: `"${this.configService.get('MAIL_FROM_NAME')}" <${this.configService.get('MAIL_FROM')}>`,
      to,
      subject,
      text,
      html,
    });
  }

  private resolveTemplatePath(templateName: string) {
    return path.join('dist/src/mail/templates', `${templateName}.hbs`);
  }

  private compileTemplate(templateName: string): Handlebars.TemplateDelegate {
    const templatePath = this.resolveTemplatePath(templateName);
    const source = fs.readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(source);
    this.templateCache.set(templateName, template);
    return template;
  }

  async sendTemplateMail(
    to: string,
    subject: string,
    templateName: string,
    context: Record<string, any>,
  ) {
    const template = this.compileTemplate(templateName);
    const html = template({
      ...context,
    });

    await this.sendMail(to, subject, subject, html);
  }
}
