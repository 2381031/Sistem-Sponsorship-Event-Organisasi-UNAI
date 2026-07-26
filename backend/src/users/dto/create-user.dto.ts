import { IsEmail, IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  nama_lengkap?: string;

  @IsEnum(['Organisasi', 'Sponsor', 'Admin'] as const)
  peran!: string;

  @IsOptional()
  @IsObject()
  organisasiDetails?: {
    nama_organisasi: string;
    deskripsi?: string;
    no_telp: string;
    nama_bank: string;
    nama_rekening: string;
    nomor_rekening: string;
  };

  @IsOptional()
  @IsObject()
  sponsorDetails?: {
    nama_perusahaan: string;
    alamat?: string;
    no_telp: string;
  };
}
