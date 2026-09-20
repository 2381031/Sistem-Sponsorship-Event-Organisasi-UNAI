import { BadRequestException } from '@nestjs/common';
import pool from '../database';
import { SponsorFile, packageMaterials } from './package-materials';

let ready: Promise<unknown> | undefined;
export function ensureSponsorFiles() {
  if (!ready) ready = pool.query("ALTER TABLE transaksi_sponsorship ADD COLUMN IF NOT EXISTS sponsor_files JSONB NOT NULL DEFAULT '[]'::jsonb")
    .catch(error => { ready = undefined; throw error; });
  return ready;
}

export function validateMaterials(paket: any, files: SponsorFile[]) {
  const rules = packageMaterials(paket);
  if (rules.logo && !files.some(file => file.kind === 'logo')) throw new BadRequestException('Paket ini mencantumkan penempatan logo. Upload logo sponsor terlebih dahulu');
  if (files.some(file => !rules[file.kind])) throw new BadRequestException('Berkas tidak sesuai manfaat paket yang dipilih');
}
