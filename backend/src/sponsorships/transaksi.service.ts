import { Injectable, NotFoundException } from '@nestjs/common';
import pool from '../database.js';

@Injectable()
export class TransaksiService {
  async create(data: any) {
    const result = await pool.query(
      `INSERT INTO transaksi_sponsorship
       (id_event, id_sponsor, id_paket, jumlah, bukti_pembayaran, status_pembayaran,
        nama_event, nama_sponsor, nama_paket, rekening_tujuan, nama_pengirim)
       VALUES ($1, $2, $3, $4, $5, 'pending_verification', $6, $7, $8, $9, $10)
       RETURNING *`,
      [data.id_event, data.id_sponsor, data.id_paket, data.jumlah,
       data.bukti_pembayaran || null, data.nama_event || null,
       data.nama_sponsor || null, data.nama_paket || null,
       data.rekening_tujuan || null, data.nama_pengirim || null],
    );
    return result.rows[0];
  }

  async findAll() {
    const result = await pool.query('SELECT * FROM transaksi_sponsorship ORDER BY id_transaksi DESC');
    return result.rows;
  }

  async findBySponsor(idSponsor: number) {
    const result = await pool.query(
      'SELECT * FROM transaksi_sponsorship WHERE id_sponsor = $1 ORDER BY id_transaksi DESC', [idSponsor],
    );
    return result.rows;
  }

  async findOne(id: number) {
    const result = await pool.query('SELECT * FROM transaksi_sponsorship WHERE id_transaksi = $1', [id]);
    if (result.rows.length === 0) throw new NotFoundException('Transaksi not found');
    return result.rows[0];
  }

  async updateStatus(id: number, status: string, adminId?: number) {
    await this.findOne(id);
    if (adminId !== undefined) {
      await pool.query(
        'UPDATE transaksi_sponsorship SET status_pembayaran = $1, id_admin_verifikator = $2 WHERE id_transaksi = $3',
        [status, adminId, id],
      );
    } else {
      await pool.query('UPDATE transaksi_sponsorship SET status_pembayaran = $1 WHERE id_transaksi = $2', [status, id]);
    }
    return this.findOne(id);
  }
}
