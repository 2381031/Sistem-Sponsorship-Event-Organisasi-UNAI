import 'reflect-metadata';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
import express, { Request, Response } from 'express';
import { AppModule } from './app.module.js';
import { UserService } from './users/user.service.js';
import { Role } from './common/enums/role.enum.js';

const expressApp = express();

// Cache instance NestJS antar invocation (penting untuk cold start di Vercel Functions)
let cachedApp: express.Express | null = null;

async function bootstrapServer(): Promise<express.Express> {
  if (cachedApp) {
    return cachedApp;
  }

  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter);
  app.setGlobalPrefix('api'); // penting: samakan dengan prefix /api/* di vercel.json rewrites
  // Global: otomatis buang field yang ditandai @Exclude() (mis. password) dari SEMUA response JSON
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  const configService = app.get(ConfigService);

  // Seed admin user (sekali saat cold start)
  try {
    const userService = app.get(UserService);
    const adminEmail = 'admin@unai.edu';
    const existing = await userService.findByEmail(adminEmail);
    if (!existing) {
      await userService.create({
        email: adminEmail,
        password: 'admin3107',
        nama_lengkap: 'Administrator UNAI',
        peran: Role.Admin,
        status_akun: 'verified',
      } as any);
      console.log(`Seeded admin user: ${adminEmail}`);
    }
  } catch (err) {
    console.error('Failed to seed admin user:', err);
  }

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.init(); // PENTING: init() bukan listen() — Vercel yang pegang HTTP server-nya
  cachedApp = expressApp;
  return expressApp;
}

// Entry point untuk jalan LOKAL (npm run start / start:dev) — tetap pakai app.listen()
// supaya development experience tidak berubah.
if (process.env.VERCEL === undefined) {
  bootstrapServer().then(() => {
    const port = process.env.PORT ?? 4000;
    expressApp.listen(port, () => {
      console.log(`Backend berjalan pada http://localhost:${port}`);
    });
  });
}