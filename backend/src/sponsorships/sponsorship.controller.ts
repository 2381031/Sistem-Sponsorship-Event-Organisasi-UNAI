import {
  Body, Controller, Get, Param, Patch, Post,
  UseGuards, Request, ParseIntPipe,
} from '@nestjs/common';
import { TransaksiService } from './transaksi.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sponsorships')
export class TransaksiController {
  constructor(private readonly transaksiService: TransaksiService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: any, @Request() req: any) {
    return this.transaksiService.create({
      id_pengguna: req.user.id_pengguna,
      id_event: body.id_event,
      id_paket: body.id_paket,
      jumlah: body.jumlah,
      bukti_pembayaran: body.bukti_pembayaran,
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
  async verify(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.transaksiService.updateStatus(id, status);
  }
}
