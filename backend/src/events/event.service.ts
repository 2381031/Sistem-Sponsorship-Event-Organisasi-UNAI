import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import pool from '../database';

@Injectable()
export class EventService {
  async create(data: {
    id_pengguna: number;
    nama_event: string;
    tanggal_event: string;
    deskripsi?: string;
    target_dana: number;
    url_proposal?: string;
    status_event?: string;
    paket_tersedia?: Array<{ nama_paket: string; persentase_dana: number; deskripsi_keuntungan?: string }>;
  }) {
    const orgResult = await pool.query('SELECT id_pengguna FROM organisasi WHERE id_pengguna = $1', [data.id_pengguna]);
    if (orgResult.rows.length === 0) throw new BadRequestException('Profil organisasi tidak ditemukan');

    const orgIdResult = await pool.query('SELECT id_organisasi FROM organisasi WHERE id_pengguna = $1', [data.id_pengguna]);
    const idOrganisasi = orgIdResult.rows[0].id_organisasi;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const evResult = await client.query(
        `INSERT INTO event (id_organisasi, nama_event, tanggal_event, deskripsi, target_dana, url_proposal, status_event)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [idOrganisasi, data.nama_event, data.tanggal_event,
         data.deskripsi || null, data.target_dana, data.url_proposal || null, data.status_event || 'Dipublikasikan'],
      );
      const event = evResult.rows[0];

      if (data.paket_tersedia && data.paket_tersedia.length > 0) {
        for (const p of data.paket_tersedia) {
          await client.query(
            `INSERT INTO paket_sponsorship (id_event, nama_paket, persentase_dana, deskripsi_keuntungan)
             VALUES ($1, $2, $3, $4)`,
            [event.id_event, p.nama_paket, p.persentase_dana, p.deskripsi_keuntungan || null],
          );
        }
      }

      await client.query('COMMIT');
      return this.findOne(event.id_event);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findAll() {
    const evResult = await pool.query('SELECT * FROM event ORDER BY id_event DESC');
    const events: any[] = [];
    for (const ev of evResult.rows) {
      const paketResult = await pool.query('SELECT * FROM paket_sponsorship WHERE id_event = $1', [ev.id_event]);
      events.push({ ...ev, paket_tersedia: paketResult.rows });
    }
    return events;
  }

  async findByOrganisasi(idPengguna: number) {
    const orgResult = await pool.query('SELECT id_organisasi FROM organisasi WHERE id_pengguna = $1', [idPengguna]);
    if (orgResult.rows.length === 0) return [];
    const idOrganisasi = orgResult.rows[0].id_organisasi;
    const evResult = await pool.query('SELECT * FROM event WHERE id_organisasi = $1 ORDER BY id_event DESC', [idOrganisasi]);
    return evResult.rows;
  }

  async findOne(id: number) {
    const evResult = await pool.query('SELECT * FROM event WHERE id_event = $1', [id]);
    if (evResult.rows.length === 0) throw new NotFoundException('Event not found');
    const paketResult = await pool.query('SELECT * FROM paket_sponsorship WHERE id_event = $1', [id]);
    return { ...evResult.rows[0], paket_tersedia: paketResult.rows };
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(data)) {
      if (key === 'paket_tersedia' || key === 'id_event') continue;
      fields.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE event SET ${fields.join(', ')} WHERE id_event = $${idx}`, values);
    }
    return this.findOne(id);
  }

  async updateStatus(id: number, status: string) {
    await this.findOne(id);
    await pool.query('UPDATE event SET status_event = $1 WHERE id_event = $2', [status, id]);
    return this.findOne(id);
  }

  async delete(id: number) {
    await this.findOne(id);
    await pool.query('DELETE FROM event WHERE id_event = $1', [id]);
  }
}
