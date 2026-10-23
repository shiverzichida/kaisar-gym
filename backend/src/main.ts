import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Kaisar Gym Ecosystem API')
    .setDescription('Sistem Manajemen Gym, POS, CRM, Portal Member, Portal Trainer & Kontrol Akses')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Kaisar Gym Backend API aktif di: http://localhost:${port}/api`);
  console.log(`📘 Swagger API Docs tersedia di: http://localhost:${port}/api/docs`);
}
bootstrap();
