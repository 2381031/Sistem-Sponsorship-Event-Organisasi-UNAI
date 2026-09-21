import React from 'react';
import { EventDoc } from '../types';

export function documentUrl(value?: string | null): string | null {
  if (!value || value.includes('fakepath')) return null;
  if (value.startsWith('/api/uploads/') && !value.includes('\\')) return value;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

export default function DocumentGallery({ docs }: { docs: EventDoc[] }) {
  return <details className="rounded-xl border border-gray-100 bg-white p-3 text-xs">
    <summary className="cursor-pointer font-bold text-blue-800">Proposal Dokumentasi ({docs.length})</summary>
    <div className="mt-3 space-y-3">
      {docs.length === 0 && <p className="text-gray-500">Organisasi belum mengunggah proposal dokumentasi.</p>}
      {docs.map((doc, index) => {
        const url = documentUrl(doc.url_file);
        const type = (doc.tipe_file || '').toUpperCase();
        return <div key={doc.id_dokumentasi} className="space-y-2 rounded-lg bg-slate-50 p-3">
          <p className="font-bold">Dokumentasi {index + 1} · {type || 'Berkas'}</p>
          {!url ? <p>Berkas lama perlu diunggah ulang oleh organisasi.</p> : <>
            {['JPG', 'JPEG'].includes(type) && <img src={url} alt={`Dokumentasi event ${index + 1}`} loading="lazy" className="max-h-64 w-full rounded-lg object-contain" />}
            {type === 'MP4' && <video src={url} controls preload="none" className="max-h-64 w-full rounded-lg">Browser tidak mendukung pemutar video.</video>}
            <a href={url} target="_blank" rel="noreferrer" className="inline-block font-bold text-blue-700 underline">Buka {type === 'PDF' ? 'Proposal Dokumentasi PDF' : 'Berkas'}</a>
          </>}
        </div>;
      })}
    </div>
  </details>;
}
