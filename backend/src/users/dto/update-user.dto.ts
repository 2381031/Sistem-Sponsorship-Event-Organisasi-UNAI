import { IsEmail, IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum.js';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  nama_lengkap?: string;

  @IsOptional()
  @IsEnum(Role)
  peran?: Role;

  @IsOptional()
  @IsString()
  status_akun?: string;

  @IsOptional()
  @IsObject()
  organisasiDetails?: {
    nama_organisasi: string;
    deskripsi?: string;
    no_telp: string;
    alamat?: string;
  };

  @IsOptional()
  @IsObject()
  sponsorDetails?: {
    nama_perusahaan: string;
    alamat?: string;
    no_telp: string;
    is_alumni: boolean;
    angkatan?: string;
    deskripsi?: string;
  };
}
