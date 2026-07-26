import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import pool from '../database.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

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

      if (dto.peran === 'organisasi' && dto.organisasiDetails) {
        await client.query(
          `INSERT INTO organisasi (id_pengguna, nama_organisasi, deskripsi, no_telp, nama_rekening, nomor_rekening)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [user.id_pengguna, dto.organisasiDetails.nama_organisasi, dto.organisasiDetails.deskripsi || null,
           dto.organisasiDetails.no_telp, dto.organisasiDetails.nama_rekening, dto.organisasiDetails.nomor_rekening],
        );
      }

      if (dto.peran === 'sponsor' && dto.sponsorDetails) {
        await client.query(
          `INSERT INTO sponsor (id_pengguna, nama_perusahaan, alamat, no_telp)
           VALUES ($1, $2, $3, $4)`,
          [user.id_pengguna, dto.sponsorDetails.nama_perusahaan,
           dto.sponsorDetails.alamat || null, dto.sponsorDetails.no_telp],
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
      `SELECT u.id_pengguna as id, u.email, u.nama_lengkap, u.peran, u.status_akun,
              o.nama_organisasi, o.no_telp as org_no_telp, o.deskripsi as org_deskripsi,
              o.nama_rekening, o.nomor_rekening,
              s.nama_perusahaan, s.alamat, s.no_telp as spon_no_telp
       FROM users u
       LEFT JOIN organisasi o ON u.id_pengguna = o.id_pengguna
       LEFT JOIN sponsor s ON u.id_pengguna = s.id_pengguna
       ORDER BY u.id_pengguna`,
    );

    return result.rows.map((r: any) => ({
      id: r.id,
      email: r.email,
      nama_lengkap: r.nama_lengkap,
      peran: r.peran,
      status_akun: r.status_akun,
      profil: r.peran === 'organisasi'
        ? { nama_organisasi: r.nama_organisasi, deskripsi: r.org_deskripsi, no_telp: r.org_no_telp, nama_rekening: r.nama_rekening, nomor_rekening: r.nomor_rekening }
        : r.peran === 'sponsor'
          ? { nama_perusahaan: r.nama_perusahaan, alamat: r.alamat, no_telp: r.spon_no_telp }
          : null,
    }));
  }

  async findByIdWithProfile(id: number) {
    const user = await this.findById(id);
    let profil: any = null;
    if (user.peran === 'organisasi') {
      const r = await pool.query('SELECT * FROM organisasi WHERE id_pengguna = $1', [user.id_pengguna]);
      if (r.rows[0]) profil = r.rows[0];
    } else if (user.peran === 'sponsor') {
      const r = await pool.query('SELECT * FROM sponsor WHERE id_pengguna = $1', [user.id_pengguna]);
      if (r.rows[0]) profil = r.rows[0];
    }
    return { id: user.id_pengguna, email: user.email, nama_lengkap: user.nama_lengkap, peran: user.peran, status_akun: user.status_akun, profil };
  }

  async updateStatus(id: number, status: string, adminId?: number) {
    await this.findById(id);
    if (adminId !== undefined) {
      await pool.query('UPDATE users SET status_akun = $1, id_admin_verifikator = $2 WHERE id_pengguna = $3', [status, adminId, id]);
    } else {
      await pool.query('UPDATE users SET status_akun = $1 WHERE id_pengguna = $2', [status, id]);
    }
    return this.findById(id);
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

      if (dto.organisasiDetails && user.peran === 'organisasi') {
        await client.query(
          `UPDATE organisasi SET nama_organisasi = $1, deskripsi = $2, no_telp = $3, nama_rekening = $4, nomor_rekening = $5
           WHERE id_pengguna = $6`,
          [dto.organisasiDetails.nama_organisasi, dto.organisasiDetails.deskripsi || null,
           dto.organisasiDetails.no_telp, dto.organisasiDetails.nama_rekening,
           dto.organisasiDetails.nomor_rekening, id],
        );
      }

      if (dto.sponsorDetails && user.peran === 'sponsor') {
        await client.query(
          `UPDATE sponsor SET nama_perusahaan = $1, alamat = $2, no_telp = $3 WHERE id_pengguna = $4`,
          [dto.sponsorDetails.nama_perusahaan, dto.sponsorDetails.alamat || null, dto.sponsorDetails.no_telp, id],
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
    await this.findById(id);
    await pool.query('DELETE FROM users WHERE id_pengguna = $1', [id]);
  }
}
