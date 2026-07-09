import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { UserService } from './users/user.service.js';
import { Role } from './common/enums/role.enum.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('PORT') ?? 4000;

  // Ensure admin user exists (seed)
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

  await app.listen(port);
  console.log(`Backend berjalan pada http://localhost:${port}`);
}

bootstrap();
