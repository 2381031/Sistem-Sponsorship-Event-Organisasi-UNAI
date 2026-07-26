import { IsEmail, IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MinLength(6) password?: string;
  @IsOptional() @IsString() nama_lengkap?: string;
  @IsOptional() @IsEnum(['organisasi', 'sponsor', 'admin'] as const) peran?: string;
  @IsOptional() @IsString() status_akun?: string;

  @IsOptional() @IsObject()
  organisasiDetails?: {
    nama_organisasi: string;
    deskripsi?: string;
    no_telp: string;
    nama_rekening: string;
    nomor_rekening: string;
  };

  @IsOptional() @IsObject()
  sponsorDetails?: {
    nama_perusahaan: string;
    alamat?: string;
    no_telp: string;
  };
}
