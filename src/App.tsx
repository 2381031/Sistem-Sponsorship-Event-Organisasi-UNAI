import React, { useState, useEffect } from 'react';
import { User, Event, SponsorshipTransaction, EventDoc } from './types';
import { mockUsers, mockEvents, mockTransactions, mockDocs } from './data';
import AuthScreen from './components/AuthScreen';
import OrganizationDashboard from './components/OrganizationDashboard';
import SponsorDashboard from './components/SponsorDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  // --- STATE INITIALIZATION WITH LOCAL STORAGE PERSISTENCE ---
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('unai_users');
    return saved ? JSON.parse(saved) : mockUsers;
  });

  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem('unai_events');
    return saved ? JSON.parse(saved) : mockEvents;
  });

  const [transactions, setTransactions] = useState<SponsorshipTransaction[]>(() => {
    const saved = localStorage.getItem('unai_transactions');
    return saved ? JSON.parse(saved) : mockTransactions;
  });

  const [docs, setDocs] = useState<EventDoc[]>(() => {
    const saved = localStorage.getItem('unai_docs');
    return saved ? JSON.parse(saved) : mockDocs;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('unai_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Auto-reset stale localStorage if it contains old mock users (to sync with empty mock state)
  useEffect(() => {
    const savedUsers = localStorage.getItem('unai_users');
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers) as User[];
        const hasStaleUsers = parsed.some(u => u.email !== 'admin@unai.edu');
        if (hasStaleUsers) {
          localStorage.removeItem('unai_users');
          localStorage.removeItem('unai_events');
          localStorage.removeItem('unai_transactions');
          localStorage.removeItem('unai_docs');
          localStorage.removeItem('unai_current_user');
          
          setAllUsers(mockUsers);
          setEvents(mockEvents);
          setTransactions(mockTransactions);
          setDocs(mockDocs);
          setCurrentUser(null);
        }
      } catch (e) {
        // ignore JSON errors
      }
    }
  }, []);

  // Sync state to local storage when changed
  useEffect(() => {
    localStorage.setItem('unai_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('unai_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('unai_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('unai_docs', JSON.stringify(docs));
  }, [docs]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('unai_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('unai_current_user');
    }
  }, [currentUser]);

  // Keep current logged-in user details in sync if admin updates their status
  useEffect(() => {
    if (currentUser) {
      const updatedUser = allUsers.find(u => u.id === currentUser.id);
      if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
        setCurrentUser(updatedUser);
      }
    }
  }, [allUsers, currentUser]);

  // --- CORE SYSTEM HANDLERS ---

  // Auth Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleRegisterUser = (newUser: User) => {
    setAllUsers(prev => [...prev, newUser]);
  };

  // Event Handlers (Organization)
  const handleCreateEvent = (newEvent: Event) => {
    setEvents(prev => [newEvent, ...prev]);
  };

  const handleUpdateEvent = (updatedEvent: Event) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  };

  const handleUploadDoc = (newDoc: EventDoc) => {
    setDocs(prev => [newDoc, ...prev]);
  };

  // Sponsorship Handlers (Sponsor)
  const handleAddTransaction = (newTx: SponsorshipTransaction) => {
    setTransactions(prev => [newTx, ...prev]);
  };

  const handleUpdateTransaction = (updatedTx: SponsorshipTransaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
  };

  // Admin Verification & Moderation Handlers
  const handleApproveUser = (userId: string) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status_akun: 'verified' as const } : u));
  };

  const handleRejectUser = (userId: string) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status_akun: 'rejected' as const } : u));
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus akun pengguna ini secara permanen dari database?')) {
      setAllUsers(prev => prev.filter(u => u.id !== userId));
      // Log out user if they are deleted
      if (currentUser?.id === userId) {
        setCurrentUser(null);
      }
    }
  };

  // Approve payment transfers (which updates event's total collected money)
  const handleApprovePayment = (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    // Update Transaction status to 'verified'
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status_pembayaran: 'verified' as const } : t));

    // Also update associated event's collected funds
    setEvents(prev => prev.map(e => {
      if (e.id === tx.id_event) {
        const newCollected = e.dana_terkumpul + tx.jumlah;
        // Check if target is achieved. If so, automatically close the event sponsorship (as described in the journal)
        const isTargetReached = newCollected >= e.target_dana;
        return {
          ...e,
          dana_terkumpul: newCollected,
          status_event: isTargetReached ? ('closed' as const) : e.status_event
        };
      }
      return e;
    }));
  };

  const handleRejectPayment = (txId: string) => {
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status_pembayaran: 'rejected' as const } : t));
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Active Workspace Column */}
        <main className="flex-1 overflow-y-auto">
          {currentUser ? (
            /* RENDER DASHBOARD ACCORDING TO USER'S ROLE */
            currentUser.peran === 'organisasi' ? (
              <OrganizationDashboard 
                currentUser={currentUser}
                events={events}
                transactions={transactions}
                docs={docs}
                onCreateEvent={handleCreateEvent}
                onUpdateEvent={handleUpdateEvent}
                onUploadDoc={handleUploadDoc}
                onLogout={handleLogout}
              />
            ) : currentUser.peran === 'sponsor' ? (
              <SponsorDashboard 
                currentUser={currentUser}
                events={events}
                transactions={transactions}
                docs={docs}
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
            /* AUTHENTICATION SCREEN */
            <AuthScreen 
              onLoginSuccess={handleLoginSuccess}
              allUsers={allUsers}
              onRegisterUser={handleRegisterUser}
            />
          )}
        </main>
      </div>

    </div>
  );
}
