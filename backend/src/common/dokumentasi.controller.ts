import {
  Body, Controller, Get, Param, Post, Delete,
  UseGuards, Request, ParseIntPipe, UseInterceptors, UploadedFile, BadRequestException, ForbiddenException, NotFoundException,
} from '@nestjs/common';
import { DokumentasiService } from './dokumentasi.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { put } from '@vercel/blob';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import pool from '../database';
import { documentFormat, DOCUMENT_MAX_BYTES } from './document-file';

@UseGuards(JwtAuthGuard)
@Controller('dokumentasi')
export class DokumentasiController {
  constructor(private readonly dokumentasiService: DokumentasiService) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: DOCUMENT_MAX_BYTES },
  }))
  @Post()
  async create(@Body() body: any, @Request() req: any, @UploadedFile() file: any) {
    const format = documentFormat(file);
    const idEvent = Number(body.id_event);
    if (!Number.isSafeInteger(idEvent) || idEvent <= 0) throw new BadRequestException('ID event tidak valid');
    const result = await pool.query('SELECT id_organisasi FROM event WHERE id_event = $1', [idEvent]);
    if (!result.rows[0]) throw new NotFoundException('Event tidak ditemukan');
    if (result.rows[0].id_organisasi !== req.user.id_pengguna) throw new ForbiddenException('Hanya pemilik event yang dapat mengunggah dokumentasi');
    const filename = `dokumentasi-${randomUUID()}.${format.extension}`;
    let url: string;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`dokumentasi/${filename}`, file.buffer, { access: 'public', contentType: format.mime });
      url = blob.url;
    } else {
      if (process.env.VERCEL) throw new BadRequestException('Penyimpanan dokumentasi belum dikonfigurasi');
      const directory = join(process.cwd(), 'uploads', 'dokumentasi');
      mkdirSync(directory, { recursive: true });
      writeFileSync(join(directory, filename), file.buffer);
      url = `/api/uploads/dokumentasi/${filename}`;
    }
    return this.dokumentasiService.create({
      id_event: idEvent,
      id_pengguna: req.user.id_pengguna,
      url_file: url,
      tipe_file: format.type,
    });
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.dokumentasiService.findAll(req.user);
  }

  @Get('event/:idEvent')
  async findByEvent(@Param('idEvent', ParseIntPipe) idEvent: number, @Request() req: any) {
    return (await this.dokumentasiService.findAll(req.user)).filter(doc => doc.id_event === idEvent);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    await this.dokumentasiService.delete(id, req.user);
    return { message: 'Dokumentasi deleted' };
  }
}
