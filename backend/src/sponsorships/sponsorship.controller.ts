import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SponsorshipService } from './sponsorship.service.js';

@Controller('sponsorships')
export class SponsorshipController {
  constructor(private readonly sponsorshipService: SponsorshipService) {}

  @Post()
  async create(@Body() data: Record<string, any>) {
    return this.sponsorshipService.create(data);
  }

  @Get()
  async findAll() {
    return this.sponsorshipService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.sponsorshipService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() update: Record<string, any>) {
    return this.sponsorshipService.update(id, update);
  }
}
