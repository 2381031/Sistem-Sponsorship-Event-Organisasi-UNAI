import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity.js';
import { Sponsorship } from '../sponsorships/sponsorship.entity.js';

@Entity()
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  id_organisasi!: string;

  @Column()
  nama_organisasi!: string;

  @Column()
  nama_event!: string;

  @Column({ nullable: true })
  tanggal_event?: string;

  @Column({ nullable: true, type: 'text' })
  deskripsi?: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  target_dana!: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  dana_terkumpul!: number;

  @Column({ nullable: true })
  proposal_url?: string;

  @Column({ nullable: true })
  proposal_name?: string;

  @Column({ default: 'open' })
  status_event!: string;

  @Column({ type: 'simple-json', nullable: true })
  paket_tersedia?: Array<Record<string, any>>;

  @ManyToOne(() => User, (user) => user.events)
  organizer!: User;

  // Sponsorship dihubungkan lewat kolom id_event (string), bukan relasi TypeORM,
  // sehingga tidak dideklarasikan sebagai @OneToMany di sini.
  // Query sponsorship per event dilakukan manual di SponsorshipService
  // menggunakan: sponsorshipRepository.find({ where: { id_event: event.id } })
}
