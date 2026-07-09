import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Sponsorship {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  id_event!: string;

  @Column()
  nama_event!: string;

  @Column()
  id_sponsor!: string;

  @Column()
  nama_sponsor!: string;

  @Column()
  id_paket!: string;

  @Column()
  nama_paket!: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  jumlah!: number;

  @Column({ nullable: true })
  bukti_pembayaran_url?: string;

  @Column({ default: 'unpaid' })
  status_pembayaran!: string;

  @Column({ nullable: true })
  tanggal_transaksi?: string;

  @Column({ nullable: true })
  rekening_tujuan?: string;

  @Column({ nullable: true })
  nama_pengirim?: string;
}
