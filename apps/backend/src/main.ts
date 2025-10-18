import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import helmet from 'helmet';
import * as cors from 'cors';
import { AppModule } from './app.module';
import { ValidationPipe as CustomValidationPipe } from './common/pipes/validation.pipe';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Sécurité avec Helmet
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", 'ws:', 'wss:'],
        },
      },
    }),
  );

  // CORS
  const corsOrigin = configService.get<string>('app.corsOrigin');
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    }),
  );

  // Validation globale
  app.useGlobalPipes(new CustomValidationPipe());

  // Intercepteur de logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Préfixe global pour l'API
  app.setGlobalPrefix('api/v1');

  const port = configService.get<number>('app.port');
  await app.listen(port);

  console.log(`🚀 Backend démarré sur le port ${port}`);
  console.log(`📚 API disponible sur http://localhost:${port}/api/v1`);
  console.log(`🔒 CORS configuré pour: ${corsOrigin}`);
}

bootstrap();
