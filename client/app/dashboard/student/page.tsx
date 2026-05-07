'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Bell, Megaphone, UserPlus, Settings, LogOut,
  CheckCircle2, Clock, Loader2, X, Send, Check, Ban, AlertTriangle, RefreshCw, Users, Globe
} from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import toast, { Toaster } from 'react-hot-toast';

//  Notification Bell 
function NotificationBell({ notifications, onMarkRead }: { notifications: any[], onMarkRead: () => void }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter(n => !n.isRead).length;
  const markAll = async () => { await api.patch('/student/notifications/read-all').catch(() => {}); onMarkRead(); };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-3 card rounded-xl hover:bg-foreground/10 transition-all">
        <Bell className="w-5 h-5" />
        {unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute right-0 mt-2 w-96 bg-[rgb(var(--background))] border border-foreground/10 rounded-3xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-foreground/5">
              <p className="font-black">Notifications</p>
              {unread > 0 && <button onClick={markAll} className="text-xs font-bold text-primary hover:underline">Mark all read</button>}
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-foreground/5">
              {notifications.length === 0 ? <p className="p-6 text-center text-foreground/40 text-sm">All caught up!</p> :
                notifications.slice(0, 15).map(n => (
                  <div key={n.id} className={`p-5 ${!n.isRead ? 'bg-primary/5' : ''}`}>
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-bold text-sm">{n.title}</p>
                      {!n.isRead && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-foreground/60 mt-1">{n.body}</p>
                    <p className="text-[10px] text-foreground/30 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                ))
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

//  Notice Banner 
function NoticeBanner({ notices }: { notices: any[] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visible = notices.filter(n => !dismissed.includes(n.id));
  if (!visible.length) return null;
  const priorityStyle = (p: string) => ({ info: 'bg-blue-500/10 border-blue-500/20 text-blue-500', warning: 'bg-orange-500/10 border-orange-500/20 text-orange-500', urgent: 'bg-red-500/10 border-red-500/20 text-red-500' } as any)[p] || '';
  return (
    <div className="space-y-3 mb-6">
      {visible.map(n => (
        <motion.div key={n.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className={`flex items-start justify-between gap-4 px-6 py-4 rounded-2xl border ${priorityStyle(n.priority)}`}>
          <div className="flex items-start gap-3">
            <Megaphone className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div><p className="font-black text-sm">{n.title}</p><p className="text-sm opacity-80 mt-0.5">{n.body}</p></div>
          </div>
          <button onClick={() => setDismissed(d => [...d, n.id])} className="flex-shrink-0 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
        </motion.div>
      ))}
    </div>
  );
}

//  10-Minute Booking Confirmation Modal 
function BookingConfirmModal({ room, hostelName, onConfirm, onCancel }: {
  room: any; hostelName: string; onConfirm: () => void; onCancel: () => void;
}) {
  const SECONDS = 10 * 60;
  const [remaining, setRemaining] = useState(SECONDS);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemaining(r => { if (r <= 1) { clearInterval(timerRef.current!); onCancel(); return 0; } return r - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, []);

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs = String(remaining % 60).padStart(2, '0');
  const pct = (remaining / SECONDS) * 100;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[rgb(var(--background))] border border-foreground/10 w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl">
        <div className="relative w-28 h-28 mx-auto mb-6">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
            <circle cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="8" className="text-foreground/10" />
            <circle cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 48}`} strokeDashoffset={`${2 * Math.PI * 48 * (1 - pct / 100)}`}
              className={remaining < 60 ? 'text-red-500' : 'text-primary'} style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-black ${remaining < 60 ? 'text-red-500' : ''}`}>{mins}:{secs}</span>
          </div>
        </div>
        <h2 className="text-2xl font-black mb-2">Confirm Your Booking</h2>
        <p className="text-foreground/50 text-sm mb-1">Room <strong className="text-foreground">{room.roomNumber}</strong></p>
        <p className="text-foreground/50 text-sm mb-6">{hostelName} • {room.capacity} seats</p>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 mb-6">
          <p className="text-orange-500 text-sm font-bold flex items-center gap-2 justify-center"><AlertTriangle className="w-4 h-4" /> Non-negotiable once confirmed</p>
          <p className="text-foreground/50 text-xs mt-1">You have {mins}:{secs} to confirm. Timeout releases the room.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 btn-secondary rounded-2xl font-bold transition-all">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-3 btn-primary text-white rounded-2xl font-bold">Confirm Room</button>
        </div>
      </motion.div>
    </div>
  );
}

//  Roommate Invite Modal 
function InviteModal({ room, windowId, onClose, onBook, onRefresh }: { room: any; windowId: string; onClose: () => void; onBook?: () => void; onRefresh: () => void }) {
  const [rollNumber, setRollNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<string[]>([]);
  const sendInvite = async () => {
    if (!rollNumber.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/student/invites', { receiverRollNumber: rollNumber.trim(), roomId: room.id, windowId });
      toast.success(data.message); setSent(s => [...s, rollNumber]); setRollNumber('');
      onRefresh();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to send invite'); } finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[rgb(var(--background))] border border-foreground/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div><h2 className="text-2xl font-black">Invite Roommates</h2><p className="text-foreground/50 text-sm mt-1">Room {room.roomNumber} • {room.capacity} seats</p></div>
          <button onClick={onClose} className="p-2 card rounded-xl text-foreground/40 hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-foreground/60 mb-4 bg-primary/5 p-4 rounded-2xl">
          Sending an invite will <strong>automatically book</strong> this room for you (if not already). 
          Room stay private during the 30-min window.
        </p>
        {sent.map(r => <div key={r} className="flex items-center gap-2 text-green-500 text-sm font-bold mb-2"><Check className="w-4 h-4" /> Invite sent to {r}</div>)}
        <div className="flex gap-3">
          <input value={rollNumber} onChange={e => setRollNumber(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendInvite()}
            placeholder="Roll number" className="flex-1 px-5 py-4 rounded-2xl bg-foreground/5 outline-none font-medium border border-transparent focus:border-primary/30" />
          <button onClick={sendInvite} disabled={loading || !rollNumber.trim()} className="px-6 py-4 btn-primary text-white rounded-2xl font-bold disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <div className="flex flex-col gap-3 mt-6">
          <button onClick={onClose} className="w-full py-4 btn-secondary rounded-2xl font-bold">Done</button>
          {onBook && <button onClick={() => { onBook(); onClose(); }} className="w-full py-4 btn-primary text-white rounded-2xl font-bold">Book Solo</button>}
        </div>
      </motion.div>
    </div>
  );
}

//  Pending Invites Banner 
function PendingInvites({ received, sent, onRefresh, responseLocked }: { received: any[]; sent: any[]; onRefresh: () => void; responseLocked: boolean }) {
  const pendingReceived = received.filter((i: any) => i.status === 'pending');
  const pendingSent = sent.filter((i: any) => i.status === 'pending');
  
  if (!pendingReceived.length && !pendingSent.length) return null;

  const respond = async (inviteId: string, action: 'accept' | 'decline') => {
    if (responseLocked) {
      toast.error('You already have a room. Cancel your allocation to respond to invites.');
      return;
    }
    try { const { data } = await api.post(`/student/invites/${inviteId}/respond`, { action }); toast.success(data.message); onRefresh(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const getExpiry = (date: string) => Math.max(0, Math.round((new Date(date).getTime() - Date.now()) / 60000));

  return (
    <div className="space-y-4 mb-8">
      {pendingReceived.length > 0 && (
        <div className="card p-6 rounded-[2.5rem] border border-primary/20">
          <h3 className="font-black mb-4 flex items-center gap-2 text-primary"><UserPlus className="w-5 h-5" /> Invites Received ({pendingReceived.length})</h3>
          <div className="space-y-3">
            {pendingReceived.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between gap-4 p-4 bg-foreground/5 rounded-2xl">
                <div>
                  <p className="font-bold text-sm">{inv.sender?.name} ({inv.sender?.rollNumber}) invited you</p>
                  <p className="text-xs text-foreground/40">Expires in {getExpiry(inv.expiresAt)} min</p>
                  {responseLocked && (
                    <p className="text-xs text-foreground/40 mt-1">Leave your current room to respond.</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(inv.id, 'accept')}
                    disabled={responseLocked}
                    className={`flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${responseLocked ? 'bg-green-500/5 text-green-500/40 cursor-not-allowed' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                  >
                    <Check className="w-4 h-4" /> Accept
                  </button>
                  <button
                    onClick={() => respond(inv.id, 'decline')}
                    disabled={responseLocked}
                    className={`flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${responseLocked ? 'bg-red-500/5 text-red-500/40 cursor-not-allowed' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                  >
                    <Ban className="w-4 h-4" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingSent.length > 0 && (
        <div className="card p-6 rounded-[2.5rem] border border-foreground/10 opacity-80">
          <h3 className="font-black mb-4 flex items-center gap-2 text-foreground/60"><Send className="w-5 h-5" /> Invites Sent ({pendingSent.length})</h3>
          <div className="space-y-3">
            {pendingSent.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between gap-4 p-4 bg-foreground/5 rounded-2xl">
                <div>
                  <p className="font-bold text-sm text-foreground/60">Waiting for {inv.receiver?.name} ({inv.receiver?.rollNumber})</p>
                  <p className="text-xs text-foreground/30">Expires in {getExpiry(inv.expiresAt)} min</p>
                </div>
                <div className="px-3 py-1 bg-foreground/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-foreground/40">Pending</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

//  Main Student Dashboard 
const POLL_INTERVAL_MS = 30_000;

export default function StudentDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'book'>('home');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [activeWindow, setActiveWindow] = useState<any>(null);
  const [eligibleHostels, setEligibleHostels] = useState<any[]>([]);
  const [selectedHostel, setSelectedHostel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<any[]>([]);
  const [sentInvites, setSentInvites] = useState<any[]>([]);
  const [inviteTargetRoom, setInviteTargetRoom] = useState<any>(null);
  const [confirmRoom, setConfirmRoom] = useState<any>(null);
  const [roomSearch, setRoomSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const loadAll = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [profileRes, notifRes, noticeRes, windowRes] = await Promise.all([
        api.get('/student/profile'),
        api.get('/student/notifications'),
        api.get('/student/notices'),
        api.get('/student/active-window'),
      ]);
      setProfile(profileRes.data);
      setNotifications(notifRes.data);
      setNotices(noticeRes.data);
      setActiveWindow(windowRes.data);
      setLastRefreshed(new Date());
    } catch { if (!silent) toast.error('Failed to load profile data'); } finally { if (!silent) setLoading(false); }
  }, []);

  const loadBooking = useCallback(async () => {
    try {
      const [hostelRes, inviteRes] = await Promise.all([api.get('/student/hostels'), api.get('/student/invites')]);
      setEligibleHostels(hostelRes.data);
      setReceivedInvites(inviteRes.data.received ?? []);
      setSentInvites(inviteRes.data.sent ?? []);
    } catch { toast.error('Failed to load hostel data'); }
  }, []);

  const loadRooms = async (hostelId: string) => {
    setRoomSearch('');
    try { setLoading(true); const { data } = await api.get(`/student/hostels/${hostelId}/rooms`); setRooms(data); }
    catch { toast.error('Failed to load rooms'); } finally { setLoading(false); }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/login'); return; }
    if (user?.mustChangePassword || user?.onboardingDone === false) { router.replace('/onboarding'); return; }
    loadAll();
    pollRef.current = setInterval(() => loadAll(true), POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (activeTab === 'book') loadBooking();
  }, [activeTab]);

  useEffect(() => {
    const invitePoll = setInterval(async () => {
      if (activeTab === 'book' || activeTab === 'home') {
        try { 
          const { data } = await api.get('/student/invites'); 
          setReceivedInvites(data.received ?? []); 
          setSentInvites(data.sent ?? []);
        } catch {}
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(invitePoll);
  }, [activeTab]);

  const initiateBooking = (room: any) => {
    if (!activeWindow) return toast.error('No active allocation window');
    setConfirmRoom(room);
  };

  const confirmBooking = async () => {
    if (!confirmRoom || !activeWindow) return;
    try {
      setLoading(true);
      await api.post('/allocations', { roomId: confirmRoom.id, windowId: activeWindow.id });
      toast.success('🏠 Room booked successfully!');
      setConfirmRoom(null);
      await loadAll();
      setActiveTab('home');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Booking failed'); setConfirmRoom(null); } finally { setLoading(false); }
  };

  const cancelBooking = async () => {
    if (!profile?.assignment || !confirm('Cancel your room allocation? This cannot be undone.')) return;
    try {
      setLoading(true);
      await api.delete(`/allocations/${profile.assignment.id}`);
      toast.success('Allocation cancelled');
      await loadAll();
      loadBooking();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Cancellation failed'); } finally { setLoading(false); }
  };

  const openRoomToPublic = async () => {
    if (!confirm('Open this room to public booking? Anyone eligible will be able to join.')) return;
    try {
      setLoading(true);
      await api.patch('/student/room/open');
      toast.success('Room is now open for public!');
      await loadAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to open room'); } finally { setLoading(false); }
  };

  const lockRoomForGroup = async () => {
    try {
      setLoading(true);
      await api.patch('/student/room/lock');
      toast.success('Room locked for 10 minutes!');
      await loadAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to lock room'); } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    const rt = localStorage.getItem('refreshToken');
    if (rt) try { await api.post('/auth/logout', { refreshToken: rt }); } catch {}
    logout(); router.push('/login');
  };

  const manualRefresh = async () => {
    await Promise.all([loadAll(), activeTab === 'book' ? loadBooking() : Promise.resolve()]);
    toast.success('Refreshed', { duration: 1500 });
  };

  const TABS = [
    { id: 'home', label: 'My Room',   icon: Home },
    { id: 'book', label: 'Book Room', icon: CheckCircle2 },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />

      {confirmRoom && (
        <BookingConfirmModal room={confirmRoom} hostelName={selectedHostel?.name ?? ''} onConfirm={confirmBooking} onCancel={() => setConfirmRoom(null)} />
      )}
      {inviteTargetRoom && activeWindow && (
        <InviteModal 
          room={inviteTargetRoom} 
          windowId={activeWindow.id} 
          onClose={() => setInviteTargetRoom(null)} 
          onBook={activeTab === 'book' ? () => initiateBooking(inviteTargetRoom) : undefined} 
          onRefresh={() => loadAll(true)}
        />
      )}

      {/* Top Nav */}
      <header className="sticky top-0 z-30 bg-white border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg leading-none text-foreground">ResidentIQ</p>
              <p className="text-xs text-muted-foreground font-medium">Student Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastRefreshed && (
              <button onClick={manualRefresh} title={`Last refreshed: ${lastRefreshed.toLocaleTimeString()}`}
                className="p-2.5 card rounded-lg text-muted-foreground hover:text-primary transition-all group">
                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              </button>
            )}
            <NotificationBell notifications={notifications} onMarkRead={() => loadAll(true)} />
            <button onClick={() => router.push('/settings')} className="p-3 card rounded-lg hover:bg-muted transition-all"><Settings className="w-5 h-5" /></button>
            <button onClick={handleLogout} className="p-3 card rounded-lg text-red-600 hover:bg-red-50 transition-all"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black">Hey, {profile?.name?.split(' ')[0] ?? 'Student'} 👋</h1>
          <p className="text-foreground/40 font-medium mt-1">{profile?.rollNumber} • {profile?.program?.toUpperCase()} Year {profile?.year} • {profile?.branch}</p>
        </div>

        <NoticeBanner notices={notices} />

        <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-6 mb-8 flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary"><RefreshCw className="w-5 h-5 animate-spin-slow" /></div>
          <div>
            <h3 className="font-black text-lg">Be Patient, Room Allocation is Live ⚡</h3>
            <p className="text-sm text-foreground/60 leading-relaxed mt-1">
              If you don't find your desired room immediately, please try again in a few minutes. 
              Rooms are locked temporarily during group bookings and released if invites are declined or expire.
            </p>
          </div>
        </div>

        <PendingInvites
          received={receivedInvites}
          sent={sentInvites}
          onRefresh={() => { loadAll(true); loadBooking(); }}
          responseLocked={profile?.assignment?.status === 'confirmed'}
        />

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.18 }}>

            {/*  HOME  */}
            {activeTab === 'home' && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Current room card */}
                <div className="card p-8 rounded-[2.5rem]">
                  <h2 className="text-xl font-black mb-6 flex items-center gap-2"><Home className="w-5 h-5 text-primary" /> Your Room</h2>
                  {profile?.assignment?.status === 'confirmed' ? (
                    <div className="space-y-6">
                      <div className="gradient-bg rounded-3xl p-6 text-white relative overflow-hidden">
                        <div className="relative z-10">
                          <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-1">Room</p>
                          <p className="text-5xl font-black">{profile.assignment.room?.roomNumber}</p>
                          <p className="text-white/80 mt-2 font-bold">{profile.assignment.room?.hostel?.name}</p>
                        </div>
                        <Users className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
                      </div>

                      {/* Occupants List */}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 mb-4">Current Occupants</p>
                        <div className="space-y-3">
                          {profile.assignment.room?.assignments?.map((a: any) => (
                            <div key={a.id} className="flex items-center justify-between p-4 card rounded-2xl">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                  {a.student?.name?.[0]}
                                </div>
                                <div>
                                  <p className="font-bold text-sm">{a.student?.name} {a.student?.id === profile.id && <span className="text-primary font-black ml-1">(You)</span>}</p>
                                  <p className="text-[10px] text-foreground/40">{a.student?.rollNumber}</p>
                                </div>
                              </div>
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </div>
                          ))}
                          {/* Vacant slots slots */}
                          {Array.from({ length: profile.assignment.room?.capacity - (profile.assignment.room?.assignments?.length ?? 0) }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border border-dashed border-foreground/10 rounded-2xl opacity-50">
                              <p className="text-xs font-bold text-foreground/40 italic">Empty Slot</p>
                              <Users className="w-4 h-4 text-foreground/10" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Group Controls */}
                      {profile.assignment.room?.assignments?.length < profile.assignment.room?.capacity && (
                        <div className="space-y-4 pt-4 border-t border-foreground/5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-foreground/40">
                              Status: <span className={profile.assignment.room?.isPublic ? 'text-green-500' : 'text-primary'}>
                                {profile.assignment.room?.isPublic ? 'Public Mode' : 'Private Group Mode'}
                              </span>
                            </p>
                            {profile.assignment.room?.privateUntil && new Date(profile.assignment.room.privateUntil) > new Date() && (
                              <p className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-black">
                                LOCK EXPIRES: {Math.round((new Date(profile.assignment.room.privateUntil).getTime() - Date.now()) / 60000)}m
                              </p>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => setInviteTargetRoom(profile.assignment.room)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-2xl font-bold text-xs hover:shadow-lg hover:shadow-primary/20 transition-all min-w-[140px]">
                              <UserPlus className="w-4 h-4" /> Invite Member
                            </button>
                            
                            {profile.assignment.bookedAt && 
                             (Date.now() - new Date(profile.assignment.bookedAt).getTime() < 5 * 60 * 1000) && 
                             (!profile.assignment.room?.privateUntil || new Date(profile.assignment.room.privateUntil) <= new Date()) && (
                              <button onClick={lockRoomForGroup} className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-2xl font-bold text-xs hover:bg-orange-500/20 transition-all min-w-[140px]">
                                <Clock className="w-4 h-4" /> Lock for 10m
                              </button>
                            )}

                            {!profile.assignment.room?.isPublic && (
                              <button onClick={openRoomToPublic} className="flex-1 flex items-center justify-center gap-2 py-3 btn-secondary rounded-2xl font-bold text-xs hover:text-primary transition-all min-w-[140px]">
                                <Globe className="w-4 h-4" /> Open for Anyone
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <button onClick={cancelBooking} disabled={loading}
                        className="w-full py-3 bg-red-500/10 text-red-500 rounded-2xl font-bold text-sm hover:bg-red-500/20 transition-colors disabled:opacity-50 mt-4">
                        Cancel Allocation
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-16 h-16 bg-foreground/5 rounded-3xl flex items-center justify-center mb-4"><Home className="w-8 h-8 text-foreground/20" /></div>
                      <p className="font-bold text-foreground/40">No room allocated yet</p>
                      <button onClick={() => setActiveTab('book')} className="mt-4 px-6 py-3 btn-primary text-white rounded-2xl font-bold text-sm">Browse Rooms</button>
                    </div>
                  )}
                </div>

                {/* Window card */}
                <div className="card p-8 rounded-[2.5rem]">
                  <h2 className="text-xl font-black mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Allocation Window</h2>
                  {activeWindow ? (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-2xl ${activeWindow.lockedAt ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-green-500/10 border border-green-500/20'}`}>
                        <p className={`font-black text-sm ${activeWindow.lockedAt ? 'text-orange-500' : 'text-green-500'}`}>
                          {activeWindow.lockedAt ? '🔒 Locked  Contact warden for changes' : '✅ Window Open  Booking Available'}
                        </p>
                      </div>
                      <p className="font-black text-lg">{activeWindow.name}</p>
                      <div className="grid grid-cols-1 gap-2 text-xs pt-4 border-t border-foreground/5">
                        <div className="flex justify-between"><span className="text-foreground/40">Opens</span><span className="font-bold">{new Date(activeWindow.opensAt).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-foreground/40">Closes</span><span className="font-bold">{new Date(activeWindow.closesAt).toLocaleString()}</span></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center py-8">
                      <Clock className="w-12 h-12 text-foreground/10 mb-4" />
                      <p className="text-foreground/40 font-bold">No active allocation window</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/*  BOOK  */}
            {activeTab === 'book' && (
              <div className="space-y-6">
                {!activeWindow ? (
                  <div className="card p-10 rounded-[2.5rem] text-center">
                    <Clock className="w-12 h-12 text-foreground/10 mx-auto mb-4" />
                    <p className="font-bold text-foreground/40">No allocation window is currently open.</p>
                  </div>
                ) : profile?.assignment?.status === 'confirmed' ? (
                  <div className="card p-12 rounded-[2.5rem] text-center border-2 border-primary/20">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black mb-2">Switching Rooms?</h2>
                    <p className="text-foreground/50 max-w-sm mx-auto mb-8">
                      You are already allocated to Room <strong>{profile.assignment.room?.roomNumber}</strong>. 
                      To book a different room, you must first cancel your current allocation.
                    </p>
                    <button onClick={cancelBooking} className="px-8 py-4 bg-red-500 text-white rounded-2xl font-bold shadow-xl shadow-red-500/20 hover:scale-105 transition-all">
                      Cancel Current Allocation
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Hostel selector */}
                    {eligibleHostels.length === 0 ? (
                      <div className="card p-10 rounded-[2.5rem] text-center">
                        <p className="text-foreground/40 font-bold">No eligible hostels found for your profile.</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-foreground/40 mb-4">Select a Hostel</p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                          {eligibleHostels.map(h => (
                            <button key={h.id} onClick={() => { setSelectedHostel(h); loadRooms(h.id); }}
                              className={`p-6 card rounded-3xl text-left transition-all border-2 ${selectedHostel?.id === h.id ? 'border-primary bg-primary/5' : 'border-transparent hover:border-primary/20'}`}>
                              <p className="font-black text-lg mb-1">{h.name}</p>
                              <p className="text-sm text-foreground/40 capitalize">{h.gender} hostel • {h._count?.rooms ?? 0} rooms</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Room grid */}
                    {selectedHostel && (
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-foreground/40 mb-4">Available Rooms in {selectedHostel.name}</p>
                        <div className="relative mb-5">
                          <input value={roomSearch} onChange={e => setRoomSearch(e.target.value)} placeholder="Search room number…"
                            className="w-full md:w-72 px-5 py-3 rounded-2xl bg-foreground/5 border border-transparent focus:border-primary/30 outline-none font-medium text-sm" />
                        </div>

                        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {rooms
                              .filter(room => !roomSearch || room.roomNumber.toLowerCase().includes(roomSearch.toLowerCase()))
                              .map(room => {
                                const occupied = room._count?.assignments ?? 0;
                                const available = room.capacity - occupied;
                                const isFull = available === 0;
                                return (
                                  <div key={room.id} className={`card p-5 rounded-3xl transition-all ${isFull ? 'opacity-40' : 'hover:border hover:border-primary/30'}`}>
                                    <p className="font-black text-2xl mb-1">{room.roomNumber}</p>
                                    <p className="text-xs text-foreground/40 font-bold mb-4">{available}/{room.capacity} seats available</p>
                                    {!isFull ? (
                                      <div className="flex gap-2">
                                        <button onClick={() => initiateBooking(room)} className="flex-1 py-2.5 btn-primary text-white rounded-xl font-bold text-xs">
                                          Book Solo
                                        </button>
                                        <button onClick={() => { setInviteTargetRoom(room); }} 
                                          className="p-2.5 card rounded-xl text-primary hover:bg-primary/5 transition-all"
                                          title="Invite Roommates">
                                          <UserPlus className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <p className="text-center text-foreground/40 text-xs font-bold py-2">Full</p>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
