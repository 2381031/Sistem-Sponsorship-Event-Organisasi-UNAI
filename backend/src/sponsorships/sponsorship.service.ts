import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sponsorship } from './sponsorship.entity.js';

@Injectable()
export class SponsorshipService {
  constructor(
    @InjectRepository(Sponsorship)
    private readonly sponsorshipRepository: Repository<Sponsorship>,
  ) {}

  async create(data: Partial<Sponsorship>): Promise<Sponsorship> {
    const sponsorship = this.sponsorshipRepository.create(data);
    return this.sponsorshipRepository.save(sponsorship);
  }

  async findAll(): Promise<Sponsorship[]> {
    return this.sponsorshipRepository.find();
  }

  async findOne(id: string): Promise<Sponsorship> {
    const sponsorship = await this.sponsorshipRepository.findOne({ where: { id } });
    if (!sponsorship) throw new NotFoundException('Sponsorship not found');
    return sponsorship;
  }

  async update(id: string, update: Partial<Sponsorship>): Promise<Sponsorship> {
    const sponsorship = await this.findOne(id);
    Object.assign(sponsorship, update);
    return this.sponsorshipRepository.save(sponsorship);
  }
}
