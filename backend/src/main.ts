import 'reflect-metadata';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
import express, { Request, Response } from 'express';
import { AppModule } from './app.module.js';

const expressApp = express();

let cachedApp: express.Express | null = null;

async function bootstrapServer(): Promise<express.Express> {
  if (cachedApp) {
    return cachedApp;
  }

  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter, { logger: ['error', 'warn', 'log'] });
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.init();
  cachedApp = expressApp;
  return expressApp;
}

if (process.env.VERCEL === undefined) {
  bootstrapServer().then(() => {
    const port = process.env.PORT ?? 4000;
    expressApp.listen(port, () => {
      console.log(`Backend berjalan pada http://localhost:${port}`);
    });
  });
}

export default async function handler(req: Request, res: Response) {
  const server = await bootstrapServer();
  server(req, res);
}
