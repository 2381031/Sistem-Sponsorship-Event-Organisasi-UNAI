import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import pool from '../database';

@Injectable()
export class TransaksiService {
  async create(data: {
    id_pengguna: number;
    id_event: number;
    id_paket: number;
    jumlah: number;
    bukti_pembayaran?: string;
    nama_event?: string;
    nama_sponsor?: string;
    nama_paket?: string;
  }) {
    const sponsorResult = await pool.query('SELECT id_pengguna FROM sponsor WHERE id_pengguna = $1', [data.id_pengguna]);
    if (sponsorResult.rows.length === 0) throw new BadRequestException('Profil sponsor tidak ditemukan');

    const result = await pool.query(
      `INSERT INTO transaksi_sponsorship
       (id_event, id_sponsor, id_paket, jumlah, bukti_pembayaran, status_pembayaran, nama_event, nama_sponsor, nama_paket)
       VALUES ($1, $2, $3, $4, $5, 'Menunggu', $6, $7, $8)
       RETURNING *`,
      [data.id_event, data.id_pengguna, data.id_paket, data.jumlah,
       data.bukti_pembayaran || null,
       data.nama_event || null, data.nama_sponsor || null, data.nama_paket || null],
    );
    return result.rows[0];
  }

  async findAll() {
    const result = await pool.query('SELECT * FROM transaksi_sponsorship ORDER BY id_transaksi DESC');
    return result.rows;
  }

  async findBySponsor(idPengguna: number) {
    const result = await pool.query(
      'SELECT * FROM transaksi_sponsorship WHERE id_sponsor = $1 ORDER BY id_transaksi DESC', [idPengguna],
    );
    return result.rows;
  }

  async findOne(id: number) {
    const result = await pool.query('SELECT * FROM transaksi_sponsorship WHERE id_transaksi = $1', [id]);
    if (result.rows.length === 0) throw new NotFoundException('Transaksi not found');
    return result.rows[0];
  }

  async updateStatus(id: number, status: string) {
    await this.findOne(id);
    await pool.query('UPDATE transaksi_sponsorship SET status_pembayaran = $1 WHERE id_transaksi = $2', [status, id]);
    return this.findOne(id);
  }
}
