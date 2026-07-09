import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sponsorship } from './sponsorship.entity.js';
import { SponsorshipController } from './sponsorship.controller.js';
import { SponsorshipService } from './sponsorship.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Sponsorship])],
  controllers: [SponsorshipController],
  providers: [SponsorshipService],
})
export class SponsorshipModule {}
