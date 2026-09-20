import {
  Body, Controller, Get, Param, Patch, Post,
  UseGuards, UseInterceptors, UploadedFiles, Request, ParseIntPipe, ForbiddenException,
} from '@nestjs/common';
import { uploadSubmission, saveSubmission } from './material-upload';
import { BadRequestException } from '@nestjs/common';
import { TransaksiService } from './transaksi.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sponsorships')
export class TransaksiController {
  constructor(private readonly transaksiService: TransaksiService) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(uploadSubmission)
  @Post()
  async create(@Body() body: any, @UploadedFiles() files: Record<string, any[]>, @Request() req: any) {
    if (req.user.peran !== 'Sponsor') throw new ForbiddenException('Hanya Sponsor yang dapat memberikan sponsorship');
    if (!files?.bukti_pembayaran?.length) throw new BadRequestException('Upload bukti pembayaran');
    const saved = await saveSubmission(files);
    try { return await this.transaksiService.create({
      id_pengguna: req.user.id_pengguna,
      id_event: body.id_event,
      id_paket: body.id_paket,
      jumlah: body.jumlah,
      bukti_pembayaran: saved.proof,
      sponsor_files: saved.materials,
      nama_event: body.nama_event,
      nama_sponsor: body.nama_sponsor,
      nama_paket: body.nama_paket,
    }); } catch (error) { await saved.cleanup(); throw error; }
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.transaksiService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async findMy(@Request() req: any) {
    return this.transaksiService.findBySponsor(req.user.id_pengguna);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const transactions = await this.transaksiService.findAll(req.user);
    const transaction = transactions.find(t => t.id_transaksi === id);
    if (!transaction) throw new ForbiddenException('Anda tidak memiliki akses ke transaksi ini');
    return transaction;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/verify')
  async verify(@Param('id', ParseIntPipe) id: number, @Body('status') status: string, @Request() req: any) {
    if (req.user.peran !== 'Admin') {
      throw new ForbiddenException('Hanya Admin yang dapat memverifikasi pembayaran sponsorship');
    }
    return this.transaksiService.updateStatus(id, status);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(uploadSubmission)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFiles() files: Record<string, any[]>,
    @Request() req: any,
  ) {
    if (req.user.peran !== 'Sponsor') throw new ForbiddenException('Hanya Sponsor pemilik transaksi yang dapat mengedit');
    const existing = await this.transaksiService.findOne(id);
    if (existing.id_sponsor !== req.user.id_pengguna) throw new ForbiddenException('Anda bukan pemilik transaksi');
    if (existing.status_pembayaran !== 'Menunggu') throw new BadRequestException('Transaksi sudah diproses oleh admin');
    const saved = await saveSubmission(files);
    try { return await this.transaksiService.update(id, req.user.id_pengguna, {
      jumlah: body.jumlah,
      bukti_pembayaran: saved.proof,
      sponsor_files: saved.materials,
      id_paket: body.id_paket,
    }); } catch (error) { await saved.cleanup(); throw error; }
  }
}
