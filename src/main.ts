import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configuração CORS
  const isDevelopment = process.env.NODE_ENV === 'development';
  const allowAllOrigins = process.env.ALLOW_ALL_ORIGINS === 'true';

  // Se ALLOW_ALL_ORIGINS=true em dev, permite todas as origens
  if (isDevelopment && allowAllOrigins) {
    console.log('⚠️  CORS: Permitindo TODAS as origens (modo desenvolvimento)');
    app.enableCors({
      origin: true, // Permite qualquer origem
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });
  } else {
    // Configuração normal com lista de origens permitidas
    const allowedOrigins: (string | RegExp)[] = [
      'http://localhost:3002',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://promata-frontend.s3-website.us-east-2.amazonaws.com',
      'https://promata.com.br',
      'https://www.promata.com.br',
    ];

    // Em desenvolvimento, permite origens adicionais
    if (isDevelopment) {
      allowedOrigins.push(
        'http://localhost:3000',
        /^http:\/\/localhost:\d+$/, // Qualquer porta local
        /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // IPs locais
      );
    }

    app.enableCors({
      origin: (origin, callback) => {
        // Permite requisições sem origin (como mobile apps, Postman, etc)
        if (!origin) return callback(null, true);

        // Verifica se origin está na lista permitida
        const isAllowed = allowedOrigins.some((allowed) => {
          if (typeof allowed === 'string') {
            return allowed === origin;
          }
          // Se for RegExp
          return allowed.test(origin);
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          console.warn(`CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });
  }

  const config = new DocumentBuilder()
    .setTitle('Pró-Mata Api')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .setVersion('0.1')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

bootstrap().catch(console.error);
