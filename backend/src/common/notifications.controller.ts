import { Controller, Get, NotFoundException, Param, ParseIntPipe, Patch, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import pool from '../database';
import { ensureNotifications } from './notifications';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  @Get()
  async list(@Request() req: any) {
    await ensureNotifications();
    return (await pool.query(
      'SELECT * FROM notifications WHERE id_pengguna = $1 ORDER BY id DESC LIMIT 100',
      [req.user.id_pengguna],
    )).rows;
  }

  @Patch(':id/read')
  async read(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    await ensureNotifications();
    const result = await pool.query(
      'UPDATE notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE id = $1 AND id_pengguna = $2 RETURNING *',
      [id, req.user.id_pengguna],
    );
    if (!result.rows[0]) throw new NotFoundException('Notifikasi tidak ditemukan');
    return result.rows[0];
  }
}
