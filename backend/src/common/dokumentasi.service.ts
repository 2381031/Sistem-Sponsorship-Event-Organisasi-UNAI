import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import pool from '../database';

@Injectable()
export class DokumentasiService {
  async create(data: { id_event: number; id_pengguna: number; url_file: string; tipe_file?: string }) {
    const result = await pool.query(
      `INSERT INTO dokumentasi (id_event, id_pengguna, url_file, tipe_file)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.id_event, data.id_pengguna, data.url_file, data.tipe_file || 'PDF'],
    );
    return result.rows[0];
  }

  async findByEvent(idEvent: number) {
    const result = await pool.query('SELECT * FROM dokumentasi WHERE id_event = $1', [idEvent]);
    return result.rows;
  }

  async findAll(user: any) {
    const result = await pool.query(`SELECT d.* FROM dokumentasi d JOIN event e ON e.id_event = d.id_event
      WHERE $1 = 'Admin' OR e.id_organisasi = $2
      OR ($1 = 'Sponsor' AND (e.status_event IN ('Dipublikasikan', 'published', 'open', 'terbuka', 'Ditutup', 'closed')
        OR EXISTS (SELECT 1 FROM transaksi_sponsorship t WHERE t.id_event = e.id_event AND t.id_sponsor = $2)))
      ORDER BY d.id_dokumentasi DESC`, [user.peran, user.id_pengguna]);
    return result.rows;
  }

  async delete(id: number, user: any) {
    const result = await pool.query('SELECT d.*, e.id_organisasi FROM dokumentasi d JOIN event e ON e.id_event = d.id_event WHERE id_dokumentasi = $1', [id]);
    if (result.rows.length === 0) throw new NotFoundException('Dokumentasi not found');
    if (user.peran !== 'Admin' && result.rows[0].id_organisasi !== user.id_pengguna) throw new ForbiddenException('Anda bukan pemilik dokumentasi');
    await pool.query('DELETE FROM dokumentasi WHERE id_dokumentasi = $1', [id]);
  }
}
