import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface Props {
  eventId: number;
  eventName: string;
  onUpload: (data: FormData) => Promise<void>;
}

export default function EventDocumentationUpload({ eventId, eventName, onUpload }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const pending = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const upload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending.current) return;
    setSuccess('');
    setError('');
    if (!file || !['application/pdf', 'image/jpeg', 'video/mp4'].includes(file.type)
      || file.size === 0 || file.size > 4 * 1024 * 1024) {
      setError('Pilih dokumentasi JPG, PDF, atau MP4 maksimal 4 MB.');
      return;
    }
    pending.current = true;
    setLoading(true);
    const data = new FormData();
    data.append('id_event', String(eventId));
    data.append('file', file);
    try {
      await onUpload(data);
      setFile(null);
      if (input.current) input.current.value = '';
      setSuccess('Dokumentasi berhasil diunggah dan tersedia di riwayat sponsor terverifikasi untuk event ini.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Dokumentasi gagal diunggah. Silakan coba lagi.');
    } finally {
      pending.current = false;
      setLoading(false);
    }
  };

  return <form onSubmit={upload} aria-label={`Unggah dokumentasi ${eventName}`} className="space-y-3 rounded-xl border border-gray-100 bg-slate-50 p-3 text-xs">
    <label htmlFor={`documentation-${eventId}`} className="block font-bold text-[#1a2c4d]">Unggah Dokumentasi Kegiatan</label>
    <p className="text-gray-500">Unggah dokumentasi pelaksanaan {eventName}. Berkas otomatis tersedia di riwayat sponsor yang pembayarannya telah diverifikasi untuk event ini.</p>
    <input ref={input} id={`documentation-${eventId}`} type="file" accept=".jpg,.jpeg,.pdf,.mp4" disabled={loading}
      aria-describedby={`documentation-help-${eventId}`} onChange={event => { setFile(event.target.files?.[0] || null); setError(''); setSuccess(''); }}
      className="block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-bold file:text-[#1a2c4d]" />
    <p id={`documentation-help-${eventId}`} className="text-gray-500">JPG, PDF, atau MP4. Maksimal 4 MB per berkas.</p>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {success && <p role="status" className="text-emerald-700">{success}</p>}
    <button type="submit" disabled={loading || !file} className="flex items-center justify-center gap-2 rounded-xl bg-[#1a2c4d] px-4 py-2.5 font-bold text-white disabled:opacity-50">
      <UploadCloud className="h-4 w-4" />{loading ? 'Mengunggah...' : 'Unggah Dokumentasi'}
    </button>
  </form>;
}
