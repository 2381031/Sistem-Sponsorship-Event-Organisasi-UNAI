import { Module } from '@nestjs/common';
import { TransaksiController } from './sponsorship.controller.js';
import { TransaksiService } from './transaksi.service.js';

@Module({
  controllers: [TransaksiController],
  providers: [TransaksiService],
  exports: [TransaksiService],
})
export class SponsorshipModule {}
