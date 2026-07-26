import {
  Body, Controller, Get, Param, Post, Delete,
  UseGuards, Request, ParseIntPipe,
} from '@nestjs/common';
import { DokumentasiService } from './dokumentasi.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('dokumentasi')
export class DokumentasiController {
  constructor(private readonly dokumentasiService: DokumentasiService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: any, @Request() req: any) {
    return this.dokumentasiService.create({
      id_event: body.id_event,
      id_pengguna: req.user.id_pengguna,
      url_file: body.url_file,
      tipe_file: body.tipe_file,
    });
  }

  @Get()
  async findAll() {
    return this.dokumentasiService.findAll();
  }

  @Get('event/:idEvent')
  async findByEvent(@Param('idEvent', ParseIntPipe) idEvent: number) {
    return this.dokumentasiService.findByEvent(idEvent);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.dokumentasiService.delete(id);
    return { message: 'Dokumentasi deleted' };
  }
}
