import { BadRequestException } from '@nestjs/common';
import { MaterialKind } from './package-materials';

export function editDetails(data: { nama_sponsor?: unknown; nama_pengirim?: unknown; remove_materials?: unknown }) {
  const name = (value: unknown, label: string, required: boolean) => {
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || value.trim().length > 255 || (required && !value.trim())) {
      throw new BadRequestException(`${label} harus berupa teks ${required ? '1 sampai ' : 'maksimal '}255 karakter`);
    }
    return value.trim();
  };
  let removed = data.remove_materials ?? [];
  if (typeof removed === 'string') {
    try { removed = JSON.parse(removed); }
    catch { throw new BadRequestException('Daftar lampiran yang dihapus tidak valid'); }
  }
  if (!Array.isArray(removed) || removed.some(kind => !['logo', 'promosi', 'produk'].includes(kind))) {
    throw new BadRequestException('Daftar lampiran yang dihapus tidak valid');
  }
  return {
    nama_sponsor: name(data.nama_sponsor, 'Nama sponsor', true),
    nama_pengirim: name(data.nama_pengirim, 'Nama pengirim', false),
    remove_materials: [...new Set(removed)] as MaterialKind[],
  };
}
