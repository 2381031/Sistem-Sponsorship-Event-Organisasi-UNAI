import { BadRequestException } from '@nestjs/common';

export const DOCUMENT_MAX_BYTES = 4 * 1024 * 1024;

export function documentFormat(file: any) {
  const bytes: Buffer | undefined = file?.buffer;
  if (!bytes?.length || bytes.length > DOCUMENT_MAX_BYTES) {
    throw new BadRequestException('Pilih dokumentasi JPG, PDF, atau MP4 maksimal 4 MB');
  }
  if (file.mimetype === 'application/pdf' && bytes.subarray(0, 5).toString() === '%PDF-') {
    return { extension: 'pdf', mime: 'application/pdf', type: 'PDF' };
  }
  if (file.mimetype === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: 'jpg', mime: 'image/jpeg', type: 'JPG' };
  }
  if (file.mimetype === 'video/mp4' && bytes.length >= 12 && bytes.subarray(4, 8).toString() === 'ftyp') {
    return { extension: 'mp4', mime: 'video/mp4', type: 'MP4' };
  }
  throw new BadRequestException('Isi berkas tidak sesuai. Gunakan JPG, PDF, atau MP4 yang valid');
}
