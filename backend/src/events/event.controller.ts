import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { EventService } from './event.service.js';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  async create(@Body() event: Record<string, any>) {
    return this.eventService.create(event);
  }

  @Get()
  async findAll() {
    return this.eventService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() update: Record<string, any>) {
    return this.eventService.update(id, update);
  }
}
