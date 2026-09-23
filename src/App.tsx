import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { User, Event, SponsorshipTransaction, EventDoc } from './types';
import { api } from './api';
import AuthScreen from './components/AuthScreen';
const dashboardLoaders = {
  Organisasi: () => import('./components/OrganizationDashboard'),
  Sponsor: () => import('./components/SponsorDashboard'),
  Admin: () => import('./components/AdminDashboard'),
};
const OrganizationDashboard = lazy(dashboardLoaders.Organisasi);
const SponsorDashboard = lazy(dashboardLoaders.Sponsor);
const AdminDashboard = lazy(dashboardLoaders.Admin);

function LoadingScreen() {
  return <div className="min-h-screen bg-slate-50 flex items-center justify-center" role="status">
    <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a2c4d] mx-auto mb-4" />
      <p className="text-xs text-gray-400 font-bold">Memuat data dari server...</p></div>
  </div>;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('unai_current_user');
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });

  const [events, setEvents] = useState<Event[]>([]);
  const [transactions, setTransactions] = useState<SponsorshipTransaction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [docs, setDocs] = useState<EventDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataErrors, setDataErrors] = useState<Record<string, string>>({});
  const revision = useRef(0);
  const session = useRef(0);
  const pendingWrites = useRef(0);
  const activeLoad = useRef<{ revision: number; ready: Promise<void> } | null>(null);
  const lastRefresh = useRef(0);

  const loadAllData = useCallback(async () => {
    if (!currentUser || pendingWrites.current) return;
    if (activeLoad.current?.revision === revision.current) return activeLoad.current.ready;
    const startedRevision = revision.current;
    const token = localStorage.getItem('unai_token');
    const isCurrent = () => startedRevision === revision.current && token === localStorage.getItem('unai_token');
    // Each dataset commits independently; a missing documentation table must not hide events.
    const read = async <T,>(label: string, fetchData: () => Promise<T>, apply: (value: T) => void) => {
      try {
        const result = await fetchData();
        if (!isCurrent()) return;
        apply(result);
        setDataErrors(previous => { const next = { ...previous }; delete next[label]; return next; });
      } catch (error) {
        if (isCurrent()) setDataErrors(previous => ({ ...previous, [label]: error instanceof Error ? error.message : 'Server tidak dapat dihubungi.' }));
      }
    };
    const primary = [
      read('Event', api.getEvents, setEvents),
      read('Transaksi', api.getTransactions, setTransactions),
    ];
    if (currentUser.peran === 'Admin') primary.push(read('Pengguna', api.getUsers, setAllUsers));
    if (currentUser.peran === 'Sponsor') primary.push(read('Organisasi', api.getOrganizations, setAllUsers));
    const secondary = [read('Profil', () => api.getUser(currentUser.id), profile => {
      setCurrentUser(previous => previous?.id === profile.id && JSON.stringify(previous) !== JSON.stringify(profile) ? profile : previous);
    })];
    if (currentUser.peran !== 'Admin') secondary.push(read('Dokumentasi', api.getAllDocs, setDocs));
    const ready = Promise.all(primary).then(() => undefined);
    const operation = { revision: startedRevision, ready };
    activeLoad.current = operation;
    void Promise.all([ready, ...secondary]).finally(() => {
      if (activeLoad.current === operation) {
        activeLoad.current = null;
        lastRefresh.current = Date.now();
      }
    });
    return ready;
  }, [currentUser?.id, currentUser?.peran]);

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('unai_token');
    if (token && currentUser) {
      // Download only this role's dashboard, concurrently with its data.
      void dashboardLoaders[currentUser.peran]().catch(() => {});
      loadAllData().finally(() => { if (mounted) setLoading(false); });
    } else {
      setLoading(false);
    }
    return () => { mounted = false; };
  }, [currentUser?.id, loadAllData]);

  useEffect(() => {
    if (!currentUser) return;
    const refresh = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastRefresh.current >= 15000) void loadAllData();
    };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [currentUser?.id, loadAllData]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('unai_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('unai_current_user');
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: User) => {
    session.current++;
    pendingWrites.current = 0;
    revision.current++;
    activeLoad.current = null;
    lastRefresh.current = 0;
    setCurrentUser(user);
    setLoading(true);
  };

  const handleLogout = () => {
    session.current++;
    pendingWrites.current = 0;
    revision.current++;
    activeLoad.current = null;
    api.clearToken();
    localStorage.removeItem('unai_current_user');
    setCurrentUser(null);
    setEvents([]);
    setTransactions([]);
    setAllUsers([]);
    setDocs([]);
    setDataErrors({});
  };

  const handleRegisterUser = async (data: any) => {
    await api.register(data);
  };

  const save = async <T,>(action: () => Promise<T>, apply: (result: T) => void) => {
    const token = localStorage.getItem('unai_token');
    const startedSession = session.current;
    revision.current++;
    pendingWrites.current++;
    try {
      const result = await action();
      if (startedSession === session.current && token === localStorage.getItem('unai_token')) apply(result);
      return result;
    } finally {
      if (startedSession === session.current) {
        revision.current++;
        pendingWrites.current--;
      }
    }
  };

  const handleCreateEvent = async (eventData: any) => {
    await save(() => api.createEvent(eventData), event =>
      setEvents(previous => [event, ...previous.filter(item => item.id_event !== event.id_event)]));
  };

  const handleUpdateEvent = async (id: number, data: any) => {
    await save(() => api.updateEvent(id, data), event =>
      setEvents(previous => previous.map(item => item.id_event === id ? { ...item, ...event } : item)));
  };

  const handleUpdateEventStatus = async (id: number, status: string) => {
    await save(() => api.updateEventStatus(id, status), event =>
      setEvents(previous => previous.map(item => item.id_event === id ? { ...item, ...event } : item)));
  };

  const handleAddTransaction = async (txData: any) => {
    await save(() => api.createTransaction(txData), tx =>
      setTransactions(previous => [tx, ...previous.filter(item => item.id_transaksi !== tx.id_transaksi)]));
  };

  const handleUpdateTransaction = async (id: number, data: FormData) => {
    await save(() => api.updateTransaction(id, data), tx =>
      setTransactions(previous => previous.map(item => item.id_transaksi === id ? { ...item, ...tx } : item)));
  };

  const handleApproveUser = async (userId: number) => {
    await save(() => api.updateUserStatus(userId, 'Aktif'), user =>
      setAllUsers(previous => previous.map(item => item.id === userId ? user : item)));
  };

  const handleRejectUser = async (userId: number) => {
    await save(() => api.updateUserStatus(userId, 'Ditolak'), user =>
      setAllUsers(previous => previous.map(item => item.id === userId ? user : item)));
  };

  const handleDeleteUser = async (userId: number) => {
    await save(() => api.deleteUser(userId), () =>
      setAllUsers(previous => previous.filter(item => item.id !== userId)));
  };

  const handleApprovePayment = async (txId: number) => {
    const startedSession = session.current;
    await save(() => api.verifyTransaction(txId, 'Diverifikasi'), tx =>
      setTransactions(previous => previous.map(item => item.id_transaksi === txId ? { ...item, ...tx } : item)));
    // Refresh funding/status after approval without delaying the successful action.
    if (startedSession === session.current) void loadAllData();
  };

  const handleRejectPayment = async (txId: number) => {
    await save(() => api.verifyTransaction(txId, 'Ditolak'), tx =>
      setTransactions(previous => previous.map(item => item.id_transaksi === txId ? { ...item, ...tx } : item)));
  };

  if (loading && currentUser) {
    return <LoadingScreen />;
  }

  return (
    <div id="app-root-container" className="min-h-screen min-h-[100dvh] bg-slate-50 flex flex-col font-sans">
      {currentUser && Object.keys(dataErrors).length > 0 && (
        <div role="alert" className="border-b border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>Sebagian data belum berhasil dimuat. Tampilan kosong belum berarti data Anda terhapus.</p>
          {Object.entries(dataErrors).map(([label, message]) => <p key={label} className="mt-1">{label}: {message}</p>)}
          <button type="button" className="mt-2 font-bold underline" onClick={() => {
            void loadAllData();
          }}>Coba lagi</button>
          <button type="button" className="ml-4 font-bold underline" onClick={handleLogout}>Keluar / masuk ulang</button>
        </div>
      )}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<LoadingScreen />}>
          {currentUser ? (
            currentUser.peran === 'Organisasi' ? (
              <OrganizationDashboard
                currentUser={currentUser}
                events={events}
                transactions={transactions}
                docs={docs}
                onCreateEvent={handleCreateEvent}
                onUpdateEvent={handleUpdateEvent}
                onUpdateEventStatus={handleUpdateEventStatus}
                onLogout={handleLogout}
              />
            ) :             currentUser.peran === 'Sponsor' ? (
              <SponsorDashboard
                currentUser={currentUser}
                events={events}
                transactions={transactions}
                docs={docs}
                allUsers={allUsers}
                onAddTransaction={handleAddTransaction}
                onUpdateTransaction={handleUpdateTransaction}
                onLogout={handleLogout}
              />
            ) : (
              <AdminDashboard
                currentUser={currentUser}
                allUsers={allUsers}
                events={events}
                transactions={transactions}
                onApproveUser={handleApproveUser}
                onRejectUser={handleRejectUser}
                onDeleteUser={handleDeleteUser}
                onApprovePayment={handleApprovePayment}
                onRejectPayment={handleRejectPayment}
                onLogout={handleLogout}
              />
            )
          ) : (
            <AuthScreen
              onLoginSuccess={handleLoginSuccess}
              onRegisterUser={handleRegisterUser}
            />
          )}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
