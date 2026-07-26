import { Injectable, NotFoundException } from '@nestjs/common';
import pool from '../database';

@Injectable()
export class DokumentasiService {
  async create(data: { id_event: number; id_pengguna: number; url_file: string; tipe_file?: string }) {
    const result = await pool.query(
      `INSERT INTO dokumentasi (id_event, id_pengguna, url_file, tipe_file)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.id_event, data.id_pengguna, data.url_file, data.tipe_file || 'pdf'],
    );
    return result.rows[0];
  }

  async findByEvent(idEvent: number) {
    const result = await pool.query('SELECT * FROM dokumentasi WHERE id_event = $1', [idEvent]);
    return result.rows;
  }

  async findAll() {
    const result = await pool.query('SELECT * FROM dokumentasi ORDER BY id_dokumentasi DESC');
    return result.rows;
  }

  async delete(id: number) {
    const result = await pool.query('SELECT * FROM dokumentasi WHERE id_dokumentasi = $1', [id]);
    if (result.rows.length === 0) throw new NotFoundException('Dokumentasi not found');
    await pool.query('DELETE FROM dokumentasi WHERE id_dokumentasi = $1', [id]);
  }
}
