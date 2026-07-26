import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { EventModule } from './events/event.module';
import { SponsorshipModule } from './sponsorships/sponsorship.module';
import { DokumentasiModule } from './common/dokumentasi.module';

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
