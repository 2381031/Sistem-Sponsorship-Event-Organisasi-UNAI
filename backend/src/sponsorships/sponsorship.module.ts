import { Module } from '@nestjs/common';
import { TransaksiController } from './sponsorship.controller';
import { TransaksiService } from './transaksi.service';

@Module({
  controllers: [TransaksiController],
  providers: [TransaksiService],
  exports: [TransaksiService],
})
export class SponsorshipModule {}
