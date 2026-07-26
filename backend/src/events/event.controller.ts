import {
  Body, Controller, Get, Param, Patch, Post, Delete,
  UseGuards, Request, ParseIntPipe,
} from '@nestjs/common';
import { EventService } from './event.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: any, @Request() req: any) {
    return this.eventService.create({
      id_pengguna: req.user.id_pengguna,
      nama_event: body.nama_event,
      tanggal_event: body.tanggal_event,
      deskripsi: body.deskripsi,
      target_dana: body.target_dana,
      url_proposal: body.url_proposal,
      status_event: body.status_event,
      paket_tersedia: body.paket_tersedia,
    });
  }

  @Get()
  async findAll() {
    return this.eventService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.eventService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.eventService.updateStatus(id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.eventService.delete(id);
    return { message: 'Event deleted' };
  }
}
