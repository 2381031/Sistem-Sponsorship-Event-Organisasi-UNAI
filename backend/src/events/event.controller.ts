import {
  Body, Controller, Get, Param, Patch, Post, Delete,
  UseGuards, Request, ParseIntPipe, ForbiddenException, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { put } from '@vercel/blob';
import { EventService } from './event.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const proposalDir = join(process.cwd(), 'uploads', 'proposals');
try { if (!existsSync(proposalDir)) mkdirSync(proposalDir, { recursive: true }); } catch {}

const proposalStorage = memoryStorage();
const uploadProposal = FileInterceptor('proposal', {
  storage: proposalStorage,
  fileFilter: (_req: any, file: any, cb: any) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new BadRequestException('Proposal harus berupa file PDF'), false);
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

async function saveProposal(file?: any): Promise<string | null> {
  if (!file) return null;
  if (file.buffer?.subarray(0, 5).toString() !== '%PDF-') {
    throw new BadRequestException('Isi file proposal harus berupa PDF yang valid');
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = extname(file.originalname).toLowerCase() || '.pdf';
    const blob = await put(`proposals/proposal-${unique}${ext}`, file.buffer, {
      access: 'public',
      contentType: file.mimetype,
      addRandomSuffix: false,
    });
    return blob.url;
  }
  if (process.env.VERCEL) {
    throw new BadRequestException('Storage proposal belum dikonfigurasi: set BLOB_READ_WRITE_TOKEN');
  }
  const filename = `proposal-${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
  const { writeFileSync } = await import('fs');
  writeFileSync(join(proposalDir, filename), file.buffer);
  return `/api/uploads/proposals/${filename}`;
}

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(uploadProposal)
  @Post()
  async create(@Body() body: any, @UploadedFile() file: any, @Request() req: any) {
    if (req.user.peran !== 'Organisasi') throw new ForbiddenException('Hanya organisasi yang dapat membuat event');
    if (!file) throw new BadRequestException('Upload proposal PDF sebelum menerbitkan event');
    let paketTersedia = body.paket_tersedia;
    if (typeof paketTersedia === 'string') {
      try { paketTersedia = JSON.parse(paketTersedia); } catch { paketTersedia = []; }
    }
    return this.eventService.create({
      id_pengguna: req.user.id_pengguna,
      nama_event: body.nama_event,
      tanggal_event: body.tanggal_event,
      deskripsi: body.deskripsi,
      target_dana: body.target_dana,
      url_proposal: (await saveProposal(file))!,
      status_event: body.status_event,
      paket_tersedia: paketTersedia,
    });
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.eventService.findAll(req.user);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const events = await this.eventService.findAll(req.user);
    const event = events.find(event => event.id_event === id);
    if (!event) throw new ForbiddenException('Event tidak tersedia untuk akun ini');
    return event;
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(uploadProposal)
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Request() req: any, @UploadedFile() file: any) {
    const event = await this.eventService.findOne(id);
    if (event.id_organisasi !== req.user.id_pengguna && req.user.peran !== 'Admin') {
      throw new ForbiddenException('Anda bukan pemilik event ini');
    }
    return this.eventService.update(id, {
      ...body,
      url_proposal: (await saveProposal(file)) || event.url_proposal,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string, @Request() req: any) {
    const event = await this.eventService.findOne(id);
    if (event.id_organisasi !== req.user.id_pengguna && req.user.peran !== 'Admin') {
      throw new ForbiddenException('Anda bukan pemilik event ini');
    }
    return this.eventService.updateStatus(id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const event = await this.eventService.findOne(id);
    if (req.user.peran !== 'Admin' && event.id_organisasi !== req.user.id_pengguna) throw new ForbiddenException('Anda bukan pemilik event ini');
    await this.eventService.delete(id);
    return { message: 'Event deleted' };
  }
}
