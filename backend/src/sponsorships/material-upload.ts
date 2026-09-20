import { BadRequestException } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { put, del } from '@vercel/blob';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { SponsorFile, MaterialKind } from './package-materials';

export const MAX_SUBMISSION_BYTES = 4 * 1024 * 1024;
export const uploadSubmission = FileFieldsInterceptor([
  { name: 'bukti_pembayaran', maxCount: 1 }, { name: 'logo', maxCount: 1 },
  { name: 'promosi', maxCount: 3 }, { name: 'produk', maxCount: 3 },
], { storage: memoryStorage(), limits: { fileSize: MAX_SUBMISSION_BYTES, files: 8 } });

export function validateUpload(file: any) {
  const b = file.buffer as Buffer;
  const png = b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpg = b[0] === 255 && b[1] === 216 && b[2] === 255;
  const pdf = b.subarray(0, 5).toString() === '%PDF-';
  if (png && file.mimetype === 'image/png') return 'png';
  if (jpg && file.mimetype === 'image/jpeg') return 'jpg';
  if (pdf && file.mimetype === 'application/pdf' && !['logo', 'bukti_pembayaran'].includes(file.fieldname)) return 'pdf';
  throw new BadRequestException('Logo/bukti harus JPG atau PNG. Materi promosi dan produk boleh JPG, PNG, atau PDF');
}

export async function saveSubmission(groups: Record<string, any[]> = {}) {
  const files = Object.values(groups).flat();
  if (files.reduce((sum, file) => sum + file.buffer.length, 0) > MAX_SUBMISSION_BYTES) throw new BadRequestException('Total seluruh berkas maksimal 4 MB per pengiriman');
  files.forEach(validateUpload);
  const cleanups: Array<() => Promise<unknown>> = [];
  const cleanup = async () => { await Promise.allSettled(cleanups.map(fn => fn())); };
  const materials: SponsorFile[] = [];
  let proof: string | undefined;
  try {
    for (const file of files) {
      const filename = `${randomUUID()}.${validateUpload(file)}`;
      let url: string;
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const blob = await put(`sponsor-files/${filename}`, file.buffer, { access: 'public', contentType: file.mimetype });
        url = blob.url;
        cleanups.push(() => del(blob.url));
      } else {
        if (process.env.VERCEL) throw new BadRequestException('Penyimpanan berkas belum dikonfigurasi');
        const directory = join(process.cwd(), 'uploads', 'sponsor-files');
        await mkdir(directory, { recursive: true });
        const destination = join(directory, filename);
        await writeFile(destination, file.buffer);
        cleanups.push(() => unlink(destination));
        url = `/api/uploads/sponsor-files/${filename}`;
      }
      if (file.fieldname === 'bukti_pembayaran') proof = url;
      else materials.push({ kind: file.fieldname as MaterialKind, name: file.originalname, url, mime: file.mimetype });
    }
    return { proof, materials, cleanup };
  } catch (error) { await cleanup(); throw error; }
}
