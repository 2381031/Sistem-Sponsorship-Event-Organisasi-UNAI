import {
  Body, Controller, Get, Param, Patch, Post,
  UseGuards, Request, ParseIntPipe,
} from '@nestjs/common';
import { TransaksiService } from './transaksi.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('sponsorships')
export class TransaksiController {
  constructor(private readonly transaksiService: TransaksiService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: any, @Request() req: any) {
    return this.transaksiService.create({
      id_event: body.id_event,
      id_sponsor: req.user.id_pengguna,
      id_paket: body.id_paket,
      jumlah: body.jumlah,
      bukti_pembayaran: body.bukti_pembayaran,
      nama_event: body.nama_event,
      nama_sponsor: body.nama_sponsor,
      nama_paket: body.nama_paket,
      rekening_tujuan: body.rekening_tujuan,
      nama_pengirim: body.nama_pengirim,
    });
  }

  @Get()
  async findAll() {
    return this.transaksiService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async findMy(@Request() req: any) {
    return this.transaksiService.findBySponsor(req.user.id_pengguna);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transaksiService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/verify')
  async verify(@Param('id', ParseIntPipe) id: number, @Body('status') status: string, @Request() req: any) {
    return this.transaksiService.updateStatus(id, status, req.user.id_pengguna);
  }
}
