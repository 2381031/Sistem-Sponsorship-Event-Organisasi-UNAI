import {
  Body, Controller, Get, Param, Patch, Post,
  UseGuards, UseInterceptors, UploadedFile, Request, ParseIntPipe, ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { TransaksiService } from './transaksi.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const buktiDir = join(process.cwd(), 'uploads', 'bukti');
if (!existsSync(buktiDir)) mkdirSync(buktiDir, { recursive: true });

const imageOnlyFilter = (req: any, file: any, cb: any) => {
  if (!file.mimetype.startsWith('image/')) {
    cb(new BadRequestException('Bukti pembayaran harus berupa file gambar'), false);
    return;
  }
  cb(null, true);
};

const buktiStorage = diskStorage({
  destination: (req: any, file: any, cb: any) => cb(null, buktiDir),
  filename: (req: any, file: any, cb: any) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `bukti-${unique}${extname(file.originalname).toLowerCase()}`);
  },
});

const uploadBukti = FileInterceptor('bukti_pembayaran', {
  storage: buktiStorage,
  fileFilter: imageOnlyFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

@Controller('sponsorships')
export class TransaksiController {
  constructor(private readonly transaksiService: TransaksiService) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(uploadBukti)
  @Post()
  async create(@Body() body: any, @UploadedFile() file: any, @Request() req: any) {
    return this.transaksiService.create({
      id_pengguna: req.user.id_pengguna,
      id_event: body.id_event,
      id_paket: body.id_paket,
      jumlah: body.jumlah,
      bukti_pembayaran: file ? `/api/uploads/bukti/${file.filename}` : body.bukti_pembayaran || null,
      nama_event: body.nama_event,
      nama_sponsor: body.nama_sponsor,
      nama_paket: body.nama_paket,
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
    if (req.user.peran !== 'Admin') {
      throw new ForbiddenException('Hanya Admin yang dapat memverifikasi pembayaran sponsorship');
    }
    return this.transaksiService.updateStatus(id, status);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(uploadBukti)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFile() file: any,
    @Request() req: any,
  ) {
    return this.transaksiService.update(id, req.user.id_pengguna, {
      jumlah: body.jumlah,
      bukti_pembayaran: file ? `/api/uploads/bukti/${file.filename}` : body.bukti_pembayaran,
      id_paket: body.id_paket,
    });
  }
}
