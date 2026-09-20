import { Module } from '@nestjs/common';
import { DokumentasiController } from './dokumentasi.controller';
import { DokumentasiService } from './dokumentasi.service';
import { NotificationsController } from './notifications.controller';

@Module({
  controllers: [DokumentasiController, NotificationsController],
  providers: [DokumentasiService],
  exports: [DokumentasiService],
})
export class DokumentasiModule {}
