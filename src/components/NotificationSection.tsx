import React from 'react';
import { Bell, Check } from 'lucide-react';
import { Notification } from '../types';

interface Props {
  notifications: Notification[];
  onRead: (id: number) => Promise<void>;
}

export default function NotificationSection({ notifications, onRead }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1a2c4d]"><Bell className="h-6 w-6" /></div>
        <div>
          <h2 className="text-xl font-extrabold text-[#1a2c4d]">Notifikasi</h2>
          <p className="text-xs text-gray-400">Informasi terbaru terkait aktivitas sponsorship.</p>
        </div>
      </div>
      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-xs text-gray-400">Belum ada notifikasi.</div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <div key={notification.id} className={`bg-white rounded-2xl border p-4 shadow-sm ${notification.read_at ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs leading-5 text-gray-700">{notification.message}</p>
                  <p className="mt-2 text-[10px] text-gray-400">{new Date(notification.created_at).toLocaleString('id-ID')}</p>
                </div>
                {!notification.read_at && (
                  <button type="button" title="Tandai sudah dibaca" onClick={() => void onRead(notification.id)} className="shrink-0 rounded-lg p-2 text-blue-700 hover:bg-blue-100">
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
