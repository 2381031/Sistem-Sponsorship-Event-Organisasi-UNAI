import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import pool from '../database';
import { closeFundedEvents } from './funding';
import { EVENT_VISIBILITY_SQL } from './event-visibility';

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
    if (!data.url_proposal?.trim()) throw new BadRequestException('Upload proposal PDF sebelum menerbitkan event');
    if (!Number.isFinite(Number(data.target_dana)) || Number(data.target_dana) <= 0) throw new BadRequestException('Target dana harus lebih dari nol');
    const orgResult = await pool.query('SELECT id_pengguna FROM organisasi WHERE id_pengguna = $1', [data.id_pengguna]);
    if (orgResult.rows.length === 0) throw new BadRequestException('Profil organisasi tidak ditemukan');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const evResult = await client.query(
        `INSERT INTO event (id_organisasi, nama_event, tanggal_event, deskripsi, target_dana, url_proposal, status_event)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [data.id_pengguna, data.nama_event, data.tanggal_event,
         data.deskripsi || null, data.target_dana, data.url_proposal || null, data.status_event || 'Dipublikasikan'],
      );
      const event = evResult.rows[0];

      let packages: any[] = [];
      if (data.paket_tersedia && data.paket_tersedia.length > 0) {
        const packageResult = await client.query(
          `INSERT INTO paket_sponsorship (id_event, nama_paket, persentase_dana, deskripsi_keuntungan)
           SELECT $1, p.nama_paket, p.persentase_dana, p.deskripsi_keuntungan
           FROM unnest($2::text[], $3::numeric[], $4::text[])
             AS p(nama_paket, persentase_dana, deskripsi_keuntungan)
           RETURNING *`,
          [event.id_event, data.paket_tersedia.map(p => p.nama_paket),
           data.paket_tersedia.map(p => p.persentase_dana),
           data.paket_tersedia.map(p => p.deskripsi_keuntungan || null)],
        );
        packages = packageResult.rows;
      }

      await client.query('COMMIT');
      return { ...event, paket_tersedia: packages };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findAll(user: any) {
    await closeFundedEvents(pool);
    const evResult = await pool.query(`SELECT e.*,
      (SELECT COALESCE(SUM(t.jumlah), 0) FROM transaksi_sponsorship t WHERE t.id_event = e.id_event AND t.status_pembayaran = 'Diverifikasi') AS dana_terkumpul
      FROM event e WHERE ${EVENT_VISIBILITY_SQL}
      ORDER BY e.id_event DESC`, [user.peran, user.id_pengguna]);
    if (!evResult.rows.length) return [];
    const paketResult = await pool.query('SELECT * FROM paket_sponsorship WHERE id_event = ANY($1::int[]) ORDER BY id_paket', [evResult.rows.map(event => event.id_event)]);
    const packages = new Map<number, any[]>();
    for (const paket of paketResult.rows) {
      const group = packages.get(paket.id_event) || [];
      group.push(paket);
      packages.set(paket.id_event, group);
    }
    return evResult.rows.map(event => ({ ...event, paket_tersedia: packages.get(event.id_event) || [] }));
  }

  async findByOrganisasi(idPengguna: number) {
    const evResult = await pool.query('SELECT * FROM event WHERE id_organisasi = $1 ORDER BY id_event DESC', [idPengguna]);
    return evResult.rows;
  }

  async findOne(id: number) {
    const evResult = await pool.query('SELECT * FROM event WHERE id_event = $1', [id]);
    if (evResult.rows.length === 0) throw new NotFoundException('Event not found');
    const paketResult = await pool.query('SELECT * FROM paket_sponsorship WHERE id_event = $1', [id]);
    return { ...evResult.rows[0], paket_tersedia: paketResult.rows };
  }

  async update(id: number, data: any) {
    if (data.status_event !== undefined && !['Draft', 'Dipublikasikan', 'Ditutup'].includes(data.status_event)) throw new BadRequestException('Status event tidak valid');
    const client = await pool.connect();
    try {
    await client.query('BEGIN');
    const event = (await client.query('SELECT * FROM event WHERE id_event = $1 FOR UPDATE', [id])).rows[0];
    if (!event) throw new NotFoundException('Event tidak ditemukan');
    if (data.target_dana !== undefined && (!Number.isFinite(Number(data.target_dana)) || Number(data.target_dana) <= 0)) {
      throw new BadRequestException('Target dana harus lebih dari nol');
    }
    if ((data.status_event ?? event.status_event) === 'Dipublikasikan' && !(data.url_proposal ?? event.url_proposal)?.trim()) {
      throw new BadRequestException('Upload proposal PDF sebelum menerbitkan event');
    }
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(data)) {
      if (!['nama_event', 'tanggal_event', 'deskripsi', 'target_dana', 'url_proposal', 'status_event'].includes(key)) continue;
      fields.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
    if (fields.length > 0) {
      values.push(id);
      await client.query(`UPDATE event SET ${fields.join(', ')} WHERE id_event = $${idx}`, values);
    }
    await closeFundedEvents(client, id);
    await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
    return this.findOne(id);
  }

  async updateStatus(id: number, status: string) {
    const event = await this.findOne(id);
    if (status === 'Dipublikasikan' && !event.url_proposal?.trim()) {
      throw new BadRequestException('Lengkapi proposal PDF melalui Edit Event sebelum membuka event');
    }
    return this.update(id, { status_event: status });
  }

  async delete(id: number) {
    await this.findOne(id);
    await pool.query('DELETE FROM event WHERE id_event = $1', [id]);
  }
}
