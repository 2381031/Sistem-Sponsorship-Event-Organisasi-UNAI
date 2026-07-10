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
        // TAHAP AWAL: synchronize: true supaya tabel otomatis dibuat di NeonDB
        // yang masih kosong. SETELAH tabel berhasil terbentuk dan ada data asli,
        // ganti baris ini kembali ke:
        // synchronize: configService.get<string>('NODE_ENV') !== 'production',
        // lalu pakai TypeORM migration untuk perubahan skema selanjutnya.
        synchronize: true,
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