import 'reflect-metadata';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ClassSerializerInterceptor, ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import express, { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';

export const uploadsRoot = path.join(process.cwd(), 'uploads');
try { fs.mkdirSync(path.join(uploadsRoot, 'bukti'), { recursive: true }); } catch {}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    console.error('EXCEPTION:', exception);
    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
    } else {
      response.status(500).json({ statusCode: 500, message: (exception as any)?.message || 'Internal server error' });
    }
  }
}

const expressApp = express();

let cachedApp: express.Express | null = null;

async function bootstrapServer(): Promise<express.Express> {
  if (cachedApp) {
    return cachedApp;
  }

  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter, { logger: ['error', 'warn', 'log'] });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());

  expressApp.use('/api/uploads', express.static(uploadsRoot));

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
