import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import pool from '../database';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EVENT_VISIBILITY_SQL } from '../events/event-visibility';

const SALT_ROUNDS = 10;

@Injectable()
export class UserService {
  async create(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        `INSERT INTO users (email, kata_sandi, nama_lengkap, peran, status_akun)
         VALUES ($1, $2, $3, $4, 'Menunggu Verifikasi')
         RETURNING id_pengguna, email, nama_lengkap, peran, status_akun`,
        [dto.email, hashedPassword, dto.nama_lengkap || '', dto.peran],
      );
      const user = userResult.rows[0];

      if (dto.peran === 'Organisasi' && dto.organisasiDetails) {
        await client.query(
          `INSERT INTO organisasi (id_pengguna, nama_organisasi, deskripsi, no_telp, nama_bank, nama_rekening, nomor_rekening)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [user.id_pengguna, dto.organisasiDetails.nama_organisasi, dto.organisasiDetails.deskripsi || null,
           dto.organisasiDetails.no_telp, dto.organisasiDetails.nama_bank, dto.organisasiDetails.nama_rekening, dto.organisasiDetails.nomor_rekening],
        );
      }

      if (dto.peran === 'Sponsor' && dto.sponsorDetails) {
        await client.query(
          `INSERT INTO sponsor (id_pengguna, nama_perusahaan, alamat, no_telp, website)
           VALUES ($1, $2, $3, $4, $5)`,
          [user.id_pengguna, dto.sponsorDetails.nama_perusahaan,
           dto.sponsorDetails.alamat || null, dto.sponsorDetails.no_telp, dto.sponsorDetails.website || null],
        );
      }

      await client.query('COMMIT');
      return user;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findByEmail(email: string) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  async findById(id: number) {
    const result = await pool.query('SELECT * FROM users WHERE id_pengguna = $1', [id]);
    if (result.rows.length === 0) throw new NotFoundException('User not found');
    return result.rows[0];
  }

  async findAll() {
    const result = await pool.query(
      `SELECT u.id_pengguna as id, u.email, u.peran, u.status_akun,
              o.nama_organisasi, o.no_telp as org_no_telp, o.deskripsi as org_deskripsi,
              o.nama_bank, o.nama_rekening, o.nomor_rekening,
              s.nama_perusahaan, s.alamat, s.no_telp as spon_no_telp, s.website as spon_website
       FROM users u
       LEFT JOIN organisasi o ON u.id_pengguna = o.id_pengguna
       LEFT JOIN sponsor s ON u.id_pengguna = s.id_pengguna
       ORDER BY u.id_pengguna`,
    );

    return result.rows.map((r: any) => ({
      id: r.id,
      email: r.email,
      peran: r.peran,
      status_akun: r.status_akun,
      profil: r.peran === 'Organisasi'
        ? { nama_organisasi: r.nama_organisasi, deskripsi: r.org_deskripsi, no_telp: r.org_no_telp, nama_bank: r.nama_bank, nama_rekening: r.nama_rekening, nomor_rekening: r.nomor_rekening }
        : r.peran === 'Sponsor'
          ? { nama_perusahaan: r.nama_perusahaan, alamat: r.alamat, no_telp: r.spon_no_telp, website: r.spon_website }
          : null,
    }));
  }

  async findByIdWithProfile(id: number) {
    const result = await pool.query(
      `SELECT u.id_pengguna AS id, u.email, u.peran, u.status_akun,
              CASE WHEN u.peran = 'Organisasi' THEN to_jsonb(o)
                   WHEN u.peran = 'Sponsor' THEN to_jsonb(s)
                   ELSE NULL END AS profil
       FROM users u
       LEFT JOIN organisasi o ON u.id_pengguna = o.id_pengguna
       LEFT JOIN sponsor s ON u.id_pengguna = s.id_pengguna
       WHERE u.id_pengguna = $1`, [id],
    );
    if (!result.rows.length) throw new NotFoundException('User not found');
    return result.rows[0];
  }

  async findOrganizations(user: { peran: string; id_pengguna: number }) {
    const result = await pool.query(
      `SELECT u.id_pengguna AS id, u.peran, to_jsonb(o) AS profil
       FROM users u
       JOIN organisasi o ON u.id_pengguna = o.id_pengguna
       WHERE u.peran = 'Organisasi' AND EXISTS (
         SELECT 1 FROM event e
         WHERE e.id_organisasi = u.id_pengguna AND ${EVENT_VISIBILITY_SQL}
       )
       ORDER BY u.id_pengguna`, [user.peran, user.id_pengguna],
    );
    return result.rows;
  }

  async updateStatus(id: number, status: string, adminId?: number) {
    const result = await pool.query('UPDATE users SET status_akun = $1 WHERE id_pengguna = $2 RETURNING id_pengguna', [status, id]);
    if (!result.rows.length) throw new NotFoundException('User not found');
    return this.findByIdWithProfile(id);
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.findById(id);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (dto.password) {
        const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);
        await client.query('UPDATE users SET email = $1, kata_sandi = $2, peran = $3 WHERE id_pengguna = $4',
          [dto.email || user.email, hashed, dto.peran || user.peran, id]);
      } else {
        await client.query('UPDATE users SET email = $1, peran = $2 WHERE id_pengguna = $3',
          [dto.email || user.email, dto.peran || user.peran, id]);
      }

      if (dto.organisasiDetails && user.peran === 'Organisasi') {
        await client.query(
          `UPDATE organisasi SET nama_organisasi = $1, deskripsi = $2, no_telp = $3, nama_bank = $4, nama_rekening = $5, nomor_rekening = $6
           WHERE id_pengguna = $7`,
          [dto.organisasiDetails.nama_organisasi, dto.organisasiDetails.deskripsi || null,
           dto.organisasiDetails.no_telp, dto.organisasiDetails.nama_bank,
           dto.organisasiDetails.nama_rekening,
           dto.organisasiDetails.nomor_rekening, id],
        );
      }

      if (dto.sponsorDetails && user.peran === 'Sponsor') {
        await client.query(
          `UPDATE sponsor SET nama_perusahaan = $1, alamat = $2, no_telp = $3, website = $4 WHERE id_pengguna = $5`,
          [dto.sponsorDetails.nama_perusahaan, dto.sponsorDetails.alamat || null, dto.sponsorDetails.no_telp, dto.sponsorDetails.website || null, id],
        );
      }

      await client.query('COMMIT');
      return { message: 'User updated' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async delete(id: number) {
    const user = await this.findById(id);
    if (!['Organisasi', 'Sponsor'].includes(user.peran)) {
      throw new ForbiddenException('Hanya akun Organisasi dan Sponsor yang dapat dihapus');
    }
    try {
      await pool.query('DELETE FROM users WHERE id_pengguna = $1', [id]);
    } catch (error) {
      if ((error as { code?: string }).code === '23503') {
        throw new ConflictException('Akun masih terkait transaksi atau data lain sehingga belum dapat dihapus. Riwayat pembayaran tetap dipertahankan.');
      }
      throw error;
    }
  }
}
