import {
  Body, Controller, Get, Param, Patch, Delete,
  UseGuards, Request, ParseIntPipe, ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findByIdWithProfile(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Request() req: any) {
    if (id !== req.user.id_pengguna && req.user.peran !== 'Admin') {
      throw new ForbiddenException('Anda tidak memiliki akses untuk mengubah profil ini');
    }
    return this.userService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string, @Request() req: any) {
    if (req.user.peran !== 'Admin') {
      throw new ForbiddenException('Hanya Admin yang dapat mengubah status akun pengguna');
    }
    return this.userService.updateStatus(id, status, req.user.id_pengguna);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.userService.delete(id);
    return { message: 'User deleted' };
  }
}
