import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { Role } from '../common/enums/role.enum.js';
import { Event } from '../events/event.entity.js';
import { Sponsorship } from '../sponsorships/sponsorship.entity.js';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  nama_lengkap!: string;

  @Column({ type: 'enum', enum: Role })
  peran!: Role;

  @Column({ default: 'pending' })
  status_akun!: string;

  @Column({ type: 'simple-json', nullable: true })
  organisasiDetails?: {
    nama_organisasi: string;
    deskripsi?: string;
    no_telp: string;
    alamat?: string;
  };

  @Column({ type: 'simple-json', nullable: true })
  sponsorDetails?: {
    nama_perusahaan: string;
    alamat?: string;
    no_telp: string;
    is_alumni: boolean;
    angkatan?: string;
    deskripsi?: string;
  };

  @OneToMany(() => Event, (event) => event.organizer)
  events!: Relation<Event>[];

  // Sponsorship dihubungkan lewat kolom id_sponsor (string), bukan relasi TypeORM,
  // sehingga tidak dideklarasikan sebagai @OneToMany di sini.
  // Query sponsorship per sponsor dilakukan manual di SponsorshipService
  // menggunakan: sponsorshipRepository.find({ where: { id_sponsor: user.id } })
}