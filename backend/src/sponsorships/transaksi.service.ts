import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import pool from '../database';
import { closeFundedEvents, sponsorshipAmount } from '../events/funding';
import { SponsorFile, mergeMaterials } from './package-materials';
import { ensureSponsorFiles, validateMaterials } from './sponsor-files';

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
    sponsor_files?: SponsorFile[];
  }) {
    await ensureSponsorFiles();
    const sponsorResult = await pool.query('SELECT id_pengguna FROM sponsor WHERE id_pengguna = $1', [data.id_pengguna]);
    if (sponsorResult.rows.length === 0) throw new BadRequestException('Profil sponsor tidak ditemukan');

    const client = await pool.connect();
    try {
    await client.query('BEGIN');
    const event = (await client.query('SELECT * FROM event WHERE id_event = $1 FOR UPDATE', [data.id_event])).rows[0];
    if (!event) throw new NotFoundException('Event tidak ditemukan');
    await closeFundedEvents(client, event.id_event);
    const current = (await client.query('SELECT status_event FROM event WHERE id_event = $1', [data.id_event])).rows[0];
    if (!['Dipublikasikan', 'open', 'published', 'terbuka'].includes(current.status_event)) throw new BadRequestException('Event sudah ditutup atau belum diterbitkan');
    const paket = (await client.query('SELECT * FROM paket_sponsorship WHERE id_paket = $1 AND id_event = $2', [data.id_paket, data.id_event])).rows[0];
    if (!paket) throw new BadRequestException('Paket tidak tersedia pada event ini');
    validateMaterials(paket, data.sponsor_files || []);
    const amount = sponsorshipAmount(paket, event.target_dana, data.jumlah);
    if (!amount) throw new BadRequestException('Nominal sponsorship harus lebih dari nol');
    const result = await client.query(
      `INSERT INTO transaksi_sponsorship
       (id_event, id_sponsor, id_paket, jumlah, bukti_pembayaran, status_pembayaran, nama_event, nama_sponsor, nama_paket, sponsor_files)
       VALUES ($1, $2, $3, $4, $5, 'Menunggu', $6, $7, $8, $9::jsonb)
       RETURNING *`,
      [data.id_event, data.id_pengguna, data.id_paket, amount,
       data.bukti_pembayaran || null,
       event.nama_event, data.nama_sponsor || null, paket.nama_paket, JSON.stringify(data.sponsor_files || [])],
    );
    await client.query('COMMIT');
    return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

  async findAll(user: any) {
    await ensureSponsorFiles();
    const result = await pool.query(`SELECT t.* FROM transaksi_sponsorship t JOIN event e ON e.id_event = t.id_event
      WHERE $1 = 'Admin' OR ($1 = 'Sponsor' AND t.id_sponsor = $2)
        OR ($1 = 'Organisasi' AND e.id_organisasi = $2) ORDER BY t.id_transaksi DESC`, [user.peran, user.id_pengguna]);
    return result.rows;
  }

  async findBySponsor(idPengguna: number) {
    await ensureSponsorFiles();
    const result = await pool.query(
      'SELECT * FROM transaksi_sponsorship WHERE id_sponsor = $1 ORDER BY id_transaksi DESC', [idPengguna],
    );
    return result.rows;
  }

  async findOne(id: number) {
    await ensureSponsorFiles();
    const result = await pool.query('SELECT * FROM transaksi_sponsorship WHERE id_transaksi = $1', [id]);
    if (result.rows.length === 0) throw new NotFoundException('Transaksi not found');
    return result.rows[0];
  }

  async updateStatus(id: number, status: string) {
    if (!['Diverifikasi', 'Ditolak'].includes(status)) throw new BadRequestException('Status pembayaran tidak valid');
    const transaction = await this.findOne(id);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT id_event FROM event WHERE id_event = $1 FOR UPDATE', [transaction.id_event]);
      const latest = (await client.query('SELECT * FROM transaksi_sponsorship WHERE id_transaksi = $1 FOR UPDATE', [id])).rows[0];
      if (status === 'Diverifikasi') {
        const paket = (await client.query('SELECT * FROM paket_sponsorship WHERE id_paket = $1 AND id_event = $2', [latest.id_paket, latest.id_event])).rows[0];
        if (!paket) throw new BadRequestException('Paket tidak ditemukan');
        validateMaterials(paket, latest.sponsor_files || []);
        if (!latest.bukti_pembayaran) throw new BadRequestException('Bukti pembayaran belum tersedia');
      }
      const result = await client.query("UPDATE transaksi_sponsorship SET status_pembayaran = $1 WHERE id_transaksi = $2 AND status_pembayaran = 'Menunggu' RETURNING *", [status, id]);
      if (!result.rows[0]) throw new BadRequestException('Transaksi sudah diproses oleh admin');
      await closeFundedEvents(client, transaction.id_event);
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }

  async update(
    id: number,
    idPengguna: number,
    data: { jumlah?: number; bukti_pembayaran?: string; id_paket?: number; sponsor_files?: SponsorFile[] },
  ) {
    const original = await this.findOne(id);
    const client = await pool.connect();
    try {
    await client.query('BEGIN');
    const event = (await client.query('SELECT * FROM event WHERE id_event = $1 FOR UPDATE', [original.id_event])).rows[0];
    const transaksi = (await client.query('SELECT * FROM transaksi_sponsorship WHERE id_transaksi = $1 FOR UPDATE', [id])).rows[0];
    if (!transaksi || !event) throw new NotFoundException('Transaksi atau event tidak ditemukan');

    if (transaksi.id_sponsor !== idPengguna) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk mengubah transaksi ini');
    }

    if (transaksi.status_pembayaran !== 'Menunggu') {
      throw new BadRequestException('Hanya sponsorship yang masih Menunggu persetujuan admin yang dapat diubah');
    }

    const paket = (await client.query('SELECT * FROM paket_sponsorship WHERE id_paket = $1 AND id_event = $2', [data.id_paket ?? transaksi.id_paket, transaksi.id_event])).rows[0];
    if (!paket) throw new BadRequestException('Paket tidak tersedia pada event ini');
    const amount = sponsorshipAmount(paket, event.target_dana, data.jumlah ?? transaksi.jumlah);
    const materials = mergeMaterials(paket, transaksi.sponsor_files || [], data.sponsor_files || []);
    validateMaterials(paket, materials);
    if (!amount) throw new BadRequestException('Nominal sponsorship harus lebih dari nol');
    const result = await client.query(`UPDATE transaksi_sponsorship SET id_paket = $1, nama_paket = $2,
      jumlah = $3, bukti_pembayaran = $4, sponsor_files = $6::jsonb WHERE id_transaksi = $5 RETURNING *`,
      [paket.id_paket, paket.nama_paket, amount, data.bukti_pembayaran ?? transaksi.bukti_pembayaran, id, JSON.stringify(materials)]);
    await client.query('COMMIT');
    return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }
}
