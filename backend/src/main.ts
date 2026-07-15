import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { toNodeHandler } from 'better-auth/node';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { createAuth } from './auth/auth.config';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS must be first — before auth handler and helmet
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  app.use(helmet({ crossOriginResourcePolicy: false }));

  const prisma = app.get(PrismaService);
  const auth = createAuth(prisma);

  app.use('/api/auth', toNodeHandler(auth.handler));

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(process.env.PORT ?? 4000);
}

bootstrap();
