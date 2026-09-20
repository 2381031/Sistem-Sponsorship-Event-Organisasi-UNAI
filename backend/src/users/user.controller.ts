import {
  Body, Controller, Get, Param, Patch, Delete,
  UseGuards, Request, ParseIntPipe, ForbiddenException, BadRequestException, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req: any) {
    if (req.user.peran !== 'Admin') {
      throw new ForbiddenException('Hanya Admin yang dapat mengakses daftar pengguna');
    }
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const user = await this.userService.findByIdWithProfile(id);
    if (req.user.peran === 'Admin' || id === req.user.id_pengguna) return user;
    if (req.user.peran === 'Sponsor' && user.peran === 'Organisasi') {
      return { id: user.id, peran: user.peran, profil: user.profil };
    }
    throw new ForbiddenException('Anda tidak memiliki akses ke profil ini');
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateUserDto, @Request() req: any) {
    if (id !== req.user.id_pengguna && req.user.peran !== 'Admin') {
      throw new ForbiddenException('Anda tidak memiliki akses untuk mengubah profil ini');
    }
    if (body.peran !== undefined || body.status_akun !== undefined) throw new ForbiddenException('Peran dan status akun tidak dapat diubah melalui profil');
    return this.userService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string, @Request() req: any) {
    if (req.user.peran !== 'Admin') {
      throw new ForbiddenException('Hanya Admin yang dapat mengubah status akun pengguna');
    }
    if (!['Aktif', 'Ditolak'].includes(status)) throw new BadRequestException('Status akun tidak valid');
    return this.userService.updateStatus(id, status, req.user.id_pengguna);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    if (req.user.peran !== 'Admin') throw new ForbiddenException('Hanya Admin yang dapat menghapus pengguna');
    if (id === req.user.id_pengguna) throw new BadRequestException('Akun admin yang sedang digunakan tidak dapat dihapus');
    await this.userService.delete(id);
    return { message: 'User deleted' };
  }
}
