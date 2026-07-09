import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { EventModule } from './events/event.module.js';
import { SponsorshipModule } from './sponsorships/sponsorship.module.js';
import { UserModule } from './users/user.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        ssl: {
          rejectUnauthorized: false, // wajib untuk NeonDB serverless Postgres
        },
        // synchronize: true BERBAHAYA di production (bisa merusak data/skema).
        // Gunakan false di production, lalu jalankan migration TypeORM terpisah.
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        autoLoadEntities: true,
      }),
    }),
    AuthModule,
    UserModule,
    EventModule,
    SponsorshipModule,
  ],
})
export class AppModule {}
