import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import { INestApplication } from '@nestjs/common';
const expressLib = require('express');

let cachedApp: INestApplication;

export async function bootstrapServer(): Promise<INestApplication> {
  if (!cachedApp) {
    const expressApp = typeof expressLib === 'function' ? expressLib() : (expressLib.default ? expressLib.default() : expressLib);
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

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

    await app.init();
    cachedApp = app;
  }
  return cachedApp;
}

// Local standalone server execution
if (!process.env.VERCEL) {
  bootstrapServer().then((app) => {
    const port = process.env.PORT || 4000;
    app.listen(port).then(() => {
      console.log(`🚀 Kaisar Gym Backend API aktif di: http://localhost:${port}/api`);
      console.log(`📘 Swagger API Docs tersedia di: http://localhost:${port}/api/docs`);
    });
  });
}

// Vercel Serverless Function entry point
export default async function handler(req: any, res: any) {
  const app = await bootstrapServer();
  const expressInstance = app.getHttpAdapter().getInstance();
  return expressInstance(req, res);
}
