import { IsEmail, IsEnum, IsObject, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsOptional() @IsEmail() @MaxLength(255) email?: string;
  @IsOptional() @IsString() @MinLength(6) password?: string;
  @IsOptional() @IsString() nama_lengkap?: string;
  @IsOptional() @IsEnum(['Organisasi', 'Sponsor', 'Admin'] as const) peran?: string;
  @IsOptional() @IsString() status_akun?: string;

  @IsOptional() @IsObject()
  organisasiDetails?: {
    nama_organisasi: string;
    deskripsi?: string;
    no_telp: string;
    nama_bank: string;
    nama_rekening: string;
    nomor_rekening: string;
  };

  @IsOptional() @IsObject()
  sponsorDetails?: {
    nama_perusahaan: string;
    alamat?: string;
    no_telp: string;
    website?: string;
  };
}
