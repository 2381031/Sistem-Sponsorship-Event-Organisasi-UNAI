import React, { useState, useEffect, useCallback } from 'react';
import { User, Event, SponsorshipTransaction, EventDoc } from './types';
import { api } from './api';
import AuthScreen from './components/AuthScreen';
import OrganizationDashboard from './components/OrganizationDashboard';
import SponsorDashboard from './components/SponsorDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('unai_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [events, setEvents] = useState<Event[]>([]);
  const [transactions, setTransactions] = useState<SponsorshipTransaction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [docs, setDocs] = useState<EventDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const loadAllData = useCallback(async () => {
    if (!currentUser) return;
    setDataError(null);
    try {
      const [evts, txs, users, allDocs, profile] = await Promise.all([
        api.getEvents(),
        api.getTransactions(),
        currentUser.peran === 'Admin' ? api.getUsers() : Promise.resolve([]),
        api.getAllDocs(),
        api.getUser(currentUser.id),
      ]);
      setEvents(evts);
      setTransactions(txs);
      setAllUsers(users);
      setDocs(allDocs);
      setCurrentUser(previous => previous?.id === profile.id && JSON.stringify(previous) !== JSON.stringify(profile) ? profile : previous);
      if (currentUser.peran === 'Sponsor') {
        const organizationIds = [...new Set(evts.map(event => event.id_organisasi))];
        const organizations = await Promise.all(organizationIds.map(id => api.getUser(id)));
        setAllUsers(organizations);
      }
    } catch (err) {
      console.error('Gagal memuat data:', err);
      setDataError(err instanceof Error ? err.message : 'Server tidak dapat dihubungi.');
    }
  }, [currentUser]);

  useEffect(() => {
    const token = localStorage.getItem('unai_token');
    if (token && currentUser) {
      loadAllData().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [currentUser, loadAllData]);

  useEffect(() => {
    if (!currentUser) return;
    const refresh = () => { if (document.visibilityState === 'visible') void loadAllData(); };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [currentUser, loadAllData]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('unai_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('unai_current_user');
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setLoading(true);
  };

  const handleLogout = () => {
    api.clearToken();
    localStorage.removeItem('unai_current_user');
    setCurrentUser(null);
    setEvents([]);
    setTransactions([]);
    setAllUsers([]);
    setDocs([]);
    setDataError(null);
  };

  const handleRegisterUser = async (data: any) => {
    await api.register(data);
  };

  const handleCreateEvent = async (eventData: any) => {
    await api.createEvent(eventData);
    const evts = await api.getEvents();
    setEvents(evts);
  };

  const handleUpdateEvent = async (id: number, data: any) => {
    await api.updateEvent(id, data);
    const evts = await api.getEvents();
    setEvents(evts);
  };

  const handleUpdateEventStatus = async (id: number, status: string) => {
    await api.updateEventStatus(id, status);
    const evts = await api.getEvents();
    setEvents(evts);
  };

  const handleUploadDoc = async (docData: any) => {
    await api.createDoc(docData);
    const allDocs = await api.getAllDocs();
    setDocs(allDocs);
  };

  const handleAddTransaction = async (txData: any) => {
    await api.createTransaction(txData);
    const txs = await api.getTransactions();
    setTransactions(txs);
  };

  const handleUpdateTransaction = async (id: number, data: FormData) => {
    await api.updateTransaction(id, data);
    setTransactions(await api.getTransactions());
  };

  const handleApproveUser = async (userId: number) => {
    await api.updateUserStatus(userId, 'Aktif');
    const users = await api.getUsers();
    setAllUsers(users);
  };

  const handleRejectUser = async (userId: number) => {
    await api.updateUserStatus(userId, 'Ditolak');
    const users = await api.getUsers();
    setAllUsers(users);
  };

  const handleDeleteUser = async (userId: number) => {
    await api.deleteUser(userId);
    const users = await api.getUsers();
    setAllUsers(users);
  };

  const handleApprovePayment = async (txId: number) => {
    await api.verifyTransaction(txId, 'Diverifikasi');
    const [txs, evts] = await Promise.all([api.getTransactions(), api.getEvents()]);
    setTransactions(txs);
    setEvents(evts);
  };

  const handleRejectPayment = async (txId: number) => {
    await api.verifyTransaction(txId, 'Ditolak');
    const txs = await api.getTransactions();
    setTransactions(txs);
  };

  if (loading && currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a2c4d] mx-auto mb-4"></div>
          <p className="text-xs text-gray-400 font-bold">Memuat data dari server...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="app-root-container" className="min-h-screen min-h-[100dvh] bg-slate-50 flex flex-col font-sans">
      {currentUser && dataError && (
        <div role="alert" className="border-b border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>Data belum berhasil dimuat. Tampilan kosong belum berarti data Anda terhapus.</p>
          <p className="mt-1">{dataError}</p>
          <button type="button" className="mt-2 font-bold underline" onClick={() => {
            setLoading(true);
            void loadAllData().finally(() => setLoading(false));
          }}>Coba lagi</button>
          <button type="button" className="ml-4 font-bold underline" onClick={handleLogout}>Keluar / masuk ulang</button>
        </div>
      )}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto">
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
                onUploadDoc={handleUploadDoc}
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
        </main>
      </div>
    </div>
  );
}
