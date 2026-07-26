import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { UserModule } from './users/user.module.js';
import { EventModule } from './events/event.module.js';
import { SponsorshipModule } from './sponsorships/sponsorship.module.js';
import { DokumentasiModule } from './common/dokumentasi.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UserModule,
    EventModule,
    SponsorshipModule,
    DokumentasiModule,
  ],
})
export class AppModule {}
