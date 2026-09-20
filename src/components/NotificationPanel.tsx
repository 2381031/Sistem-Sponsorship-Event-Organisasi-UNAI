import React, { useEffect, useState } from 'react';
import { api } from '../api';

type Notice = { id: number; message: string; created_at: string; read_at: string | null };

export default function NotificationPanel() {
  const [items, setItems] = useState<Notice[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try { const result = await api.getNotifications(); if (active) { setItems(result); setError(''); } }
      catch { if (active) setError('Notifikasi belum dapat dimuat. Akan dicoba kembali otomatis.'); }
    };
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  const read = async (id: number) => {
    try {
      const updated = await api.readNotification(id);
      setItems(previous => previous.map(item => item.id === id ? updated : item));
      setError('');
    } catch { setError('Gagal menandai notifikasi. Coba kembali.'); }
  };
  return <details className="mx-auto my-3 w-full max-w-6xl rounded-xl border bg-white p-3 text-xs">
    <summary className="cursor-pointer font-bold text-[#1a2c4d]">Notifikasi Sponsorship ({items.filter(item => !item.read_at).length} belum dibaca)</summary>
    {error && <p role="alert" className="mt-2 text-red-600">{error}</p>}
    <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
      {!error && items.length === 0 && <p>Belum ada notifikasi.</p>}
      {items.map(item => <div key={item.id} className={`rounded-lg p-3 ${item.read_at ? 'bg-slate-50' : 'bg-blue-50'}`}>
        <p>{item.message}</p>
        <p className="mt-1 text-gray-500">{new Date(item.created_at).toLocaleString('id-ID')}</p>
        {!item.read_at && <button type="button" onClick={() => void read(item.id)} className="mt-2 font-bold text-blue-700 underline">Tandai dibaca</button>}
      </div>)}
    </div>
  </details>;
}
