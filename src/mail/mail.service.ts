import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';
import * as fs from 'node:fs';
import * as path from 'node:path';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;
  private templateCache = new Map<string, Handlebars.TemplateDelegate>();

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    await this.transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM}>`,
      to,
      subject,
      text,
      html,
    });
  }

  private resolveTemplatePath(templateName: string) {
    return path.join('./src/mail/templates/', `${templateName}.hbs`);
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
