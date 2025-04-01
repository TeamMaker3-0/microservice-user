// src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar validaciones globales
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // app.enableCors({
  //   origin: [
  //     'http://localhost:3000',
  //     'http://localhost:3001',
  //     'http://localhost:3002',
  //     'http://localhost:3003',
  //     'http://localhost:3004',
  //     'http://localhost:3010',
  //     'http://localhost:3011',
  //     'http://localhost:3012',
  //   ], // Ajusta los orígenes según corresponda
  //   credentials: true, // Permite enviar/recibir cookies
  // });
  app.enableCors({
    origin: true, // Ajusta los orígenes según corresponda
    credentials: true, // Permite enviar/recibir cookies
  });
  await app.listen(3001);
}
bootstrap();
