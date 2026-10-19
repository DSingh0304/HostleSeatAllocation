/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, react-hooks/purity, react-hooks/set-state-in-effect */
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
import toast from 'react-hot-toast';

function NotificationBell({ notifications, onMarkRead }: { notifications: any[], onMarkRead: () => void }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter(n => !n.isRead).length;
  const markAll = async () => { await api.patch('/student/notifications/read-all').catch(() => {}); onMarkRead(); };

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)} 
        className="relative p-2.5 bg-white border border-[#1A1A1A]/15 rounded-md hover:border-[#1A1A1A] transition-all cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-4 h-4 text-[#1A1A1A]" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D82C2C] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 8, scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#1A1A1A]/20 rounded-lg shadow-xl z-50 overflow-hidden text-left"
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-[#1A1A1A]/10 bg-[#F2F2F2]">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">Notifications</span>
              {unread > 0 && (
                <button onClick={markAll} className="text-[11px] font-mono font-bold text-[#D82C2C] hover:underline">
                  MARK READ
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-[#1A1A1A]/5">
              {notifications.length === 0 ? (
                <p className="p-6 text-center text-[#71717A] text-xs font-mono">No active notifications</p>
              ) : (
                notifications.slice(0, 15).map(n => (
                  <div key={n.id} className={`p-4 ${!n.isRead ? 'bg-[#D82C2C]/5' : ''}`}>
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-bold text-xs text-[#1A1A1A]">{n.title}</p>
                      {!n.isRead && <div className="w-1.5 h-1.5 bg-[#D82C2C] rounded-full flex-shrink-0 mt-1" />}
                    </div>
                    <p className="text-xs text-[#71717A] mt-1 leading-snug">{n.body}</p>
                    <p className="text-[10px] font-mono text-[#A9B2B1] mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NoticeBanner({ notices }: { notices: any[] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visible = notices.filter(n => !dismissed.includes(n.id));
  if (!visible.length) return null;
  const priorityStyle = (p: string) => ({ 
    info: 'bg-[#F2F2F2] border-l-4 border-l-[#0033A0] text-[#1A1A1A]', 
    warning: 'bg-[#F2F2F2] border-l-4 border-l-[#D82C2C] text-[#1A1A1A]', 
    urgent: 'bg-[#D82C2C]/10 border-l-4 border-l-[#D82C2C] text-[#D82C2C]' 
  } as any)[p] || 'bg-[#F2F2F2] border-l-4 border-l-[#1A1A1A] text-[#1A1A1A]';

  return (
    <div className="space-y-3 mb-6 text-left">
      {visible.map(n => (
        <motion.div key={n.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className={`flex items-start justify-between gap-4 px-5 py-3.5 rounded border border-[#1A1A1A]/10 ${priorityStyle(n.priority)}`}>
          <div className="flex items-start gap-3">
            <Megaphone className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#D82C2C]" />
            <div>
              <p className="font-bold text-xs font-mono uppercase tracking-wider">{n.title}</p>
              <p className="text-xs opacity-90 mt-0.5">{n.body}</p>
            </div>
          </div>
          <button onClick={() => setDismissed(d => [...d, n.id])} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      ))}
    </div>
  );
}

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
    <div className="fixed inset-0 bg-[#1A1A1A]/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white border border-[#1A1A1A]/20 w-full max-w-sm rounded-lg p-6 sm:p-8 text-center shadow-2xl"
      >
        <div className="relative w-24 h-24 mx-auto mb-4">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 112 112">
            <circle cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="6" className="text-[#F2F2F2]" />
            <circle cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="square"
              strokeDasharray={`${2 * Math.PI * 48}`} strokeDashoffset={`${2 * Math.PI * 48 * (1 - pct / 100)}`}
              className={remaining < 60 ? 'text-[#D82C2C]' : 'text-[#1A1A1A]'} style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-mono font-bold ${remaining < 60 ? 'text-[#D82C2C]' : 'text-[#1A1A1A]'}`}>
              {mins}:{secs}
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] font-bold">RESERVATION</span>
        <h2 className="text-2xl font-bold tracking-tight text-[#1A1A1A] mb-1">Confirm Room Booking</h2>
        <p className="text-sm text-[#71717A] mb-1">Room <strong className="text-[#1A1A1A] font-mono">{room.roomNumber}</strong></p>
        <p className="text-xs font-mono text-[#71717A] mb-5">{hostelName} • {room.capacity}-Bed Room</p>
        
        <div className="bg-[#F2F2F2] border border-[#1A1A1A]/10 rounded p-3 mb-6 text-left">
          <p className="text-[#D82C2C] text-xs font-mono font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> ROOM HELD FOR YOU
          </p>
          <p className="text-[11px] text-[#71717A] mt-1 leading-snug">
            You have {mins}:{secs} to confirm. This hold will release automatically upon timeout.
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 btn-secondary text-xs font-bold uppercase tracking-wider">
            Release
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 btn-primary text-xs font-bold uppercase tracking-wider">
            Confirm Booking
          </button>
        </div>
      </motion.div>
    </div>
  );
}

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
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to send invitation'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-[#1A1A1A]/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white border border-[#1A1A1A]/20 w-full max-w-md rounded-lg p-6 sm:p-8 shadow-2xl text-left">
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-[#1A1A1A]/10">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] font-bold">INVITATION</span>
            <h2 className="text-xl font-bold tracking-tight text-[#1A1A1A]">Invite Roommate</h2>
            <p className="text-xs font-mono text-[#71717A]">Room {room.roomNumber} • {room.capacity} Beds</p>
          </div>
          <button onClick={onClose} className="p-1.5 border border-[#1A1A1A]/15 rounded hover:border-[#1A1A1A] transition-colors"><X className="w-4 h-4" /></button>
        </div>
        
        <p className="text-xs text-[#71717A] mb-4 bg-[#F2F2F2] p-3 rounded border border-[#1A1A1A]/10 leading-relaxed">
          Sending an invite holds a bed in this room for your roommate for <strong>30 minutes</strong>.
        </p>

        {sent.map(r => (
          <div key={r} className="flex items-center gap-1.5 text-[#1A1A1A] font-mono text-xs font-bold mb-2">
            <Check className="w-3.5 h-3.5 text-[#D82C2C]" /> Invite sent to {r}
          </div>
        ))}

        <div className="flex gap-2 mb-6">
          <input 
            value={rollNumber} 
            onChange={e => setRollNumber(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && sendInvite()}
            placeholder="Student Roll Number (e.g. 20101)" 
            className="flex-1 text-xs font-mono" 
          />
          <button 
            onClick={sendInvite} 
            disabled={loading || !rollNumber.trim()} 
            className="px-4 py-2 btn-primary text-xs font-bold uppercase tracking-wider disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 btn-secondary text-xs font-bold uppercase tracking-wider">Dismiss</button>
          {onBook && <button onClick={() => { onBook(); onClose(); }} className="flex-1 py-2.5 btn-primary text-xs font-bold uppercase tracking-wider">Book Solo</button>}
        </div>
      </motion.div>
    </div>
  );
}

function PendingInvites({ received, sent, onRefresh, responseLocked }: { received: any[]; sent: any[]; onRefresh: () => void; responseLocked: boolean }) {
  const pendingReceived = received.filter((i: any) => i.status === 'pending');
  const pendingSent = sent.filter((i: any) => i.status === 'pending');
  
  if (!pendingReceived.length && !pendingSent.length) return null;

  const respond = async (inviteId: string, action: 'accept' | 'decline') => {
    if (responseLocked) {
      toast.error('You already have a booked room. Cancel your allocation to accept invites.');
      return;
    }
    try { const { data } = await api.post(`/student/invites/${inviteId}/respond`, { action }); toast.success(data.message); onRefresh(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const getExpiry = (date: string) => Math.max(0, Math.round((new Date(date).getTime() - Date.now()) / 60000));

  return (
    <div className="space-y-4 mb-8 text-left">
      {pendingReceived.length > 0 && (
        <div className="bg-white border border-[#1A1A1A]/15 p-5 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-[#1A1A1A]/10 pb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#D82C2C]" /> Invites Received ({pendingReceived.length})
            </span>
            <span className="text-[10px] font-mono text-[#D82C2C] font-bold">ACTION REQUIRED</span>
          </div>

          <div className="space-y-2.5">
            {pendingReceived.map((inv: any) => (
              <div key={inv.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-[#F2F2F2] rounded border border-[#1A1A1A]/10">
                <div>
                  <p className="font-bold text-xs text-[#1A1A1A]">{inv.sender?.name} ({inv.sender?.rollNumber}) invited you</p>
                  <p className="text-[11px] font-mono text-[#71717A]">Expires in {getExpiry(inv.expiresAt)} minutes</p>
                  {responseLocked && (
                    <p className="text-[11px] text-[#D82C2C] font-mono mt-0.5">Cancel your current room to accept.</p>
                  )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => respond(inv.id, 'accept')}
                    disabled={responseLocked}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                      responseLocked ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#1A1A1A] text-white hover:bg-[#D82C2C]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" /> Accept
                  </button>
                  <button
                    onClick={() => respond(inv.id, 'decline')}
                    disabled={responseLocked}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 border border-[#1A1A1A]/20 hover:border-[#D82C2C] hover:text-[#D82C2C] rounded font-mono text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingSent.length > 0 && (
        <div className="bg-white border border-[#1A1A1A]/15 p-5 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-[#1A1A1A]/10 pb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-2">
              <Send className="w-4 h-4 text-[#0033A0]" /> Outbound Roommate Invites ({pendingSent.length})
            </span>
            <span className="text-[10px] font-mono text-[#71717A]">PENDING RESPONSE</span>
          </div>

          <div className="space-y-2">
            {pendingSent.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between gap-4 p-3 bg-[#F2F2F2] rounded border border-[#1A1A1A]/10">
                <div>
                  <p className="font-bold text-xs text-[#1A1A1A]">Student: {inv.receiver?.name} ({inv.receiver?.rollNumber})</p>
                  <p className="text-[11px] font-mono text-[#71717A]">Expires in {getExpiry(inv.expiresAt)} min remaining</p>
                </div>
                <div className="px-2 py-0.5 bg-white border border-[#1A1A1A]/15 rounded text-[10px] font-mono font-bold uppercase tracking-widest text-[#71717A]">
                  HOLD
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const POLL_INTERVAL_MS = 30_000;

export default function StudentDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [activeWindow, setActiveWindow] = useState<any>(null);
  const [eligibleHostels, setEligibleHostels] = useState<any[]>([]);
  const [selectedHostel, setSelectedHostel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomSearch, setRoomSearch] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<any[]>([]);
  const [sentInvites, setSentInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [confirmRoom, setConfirmRoom] = useState<any>(null);
  const [inviteTargetRoom, setInviteTargetRoom] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'book'>('home');

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) router.replace('/login');
  }, [router]);

  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [pRes, nRes, notRes, invRes] = await Promise.all([
        api.get('/student/profile'),
        api.get('/student/notifications'),
        api.get('/student/notices'),
        api.get('/student/invites'),
      ]);
      setProfile(pRes.data);
      setNotifications(nRes.data);
      setNotices(notRes.data);
      setReceivedInvites(invRes.data?.received ?? []);
      setSentInvites(invRes.data?.sent ?? []);
      setLastRefreshed(new Date());
    } catch {
      toast.error('Failed to update status');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadBooking = useCallback(async () => {
    try {
      const { data } = await api.get('/student/booking-state');
      setActiveWindow(data.window);
      setEligibleHostels(data.hostels ?? []);
      if (data.hostels?.length > 0 && !selectedHostel) {
        setSelectedHostel(data.hostels[0]);
        loadRooms(data.hostels[0].id);
      }
    } catch {}
  }, [selectedHostel]);

  const loadRooms = async (hostelId: string) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/student/hostels/${hostelId}/rooms`);
      setRooms(data);
    } catch {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    loadBooking();
    pollRef.current = setInterval(() => { loadAll(true); }, POLL_INTERVAL_MS);
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
    if (!activeWindow) return toast.error('No allocation window is currently open');
    setConfirmRoom(room);
  };

  const confirmBooking = async () => {
    if (!confirmRoom || !activeWindow) return;
    try {
      setLoading(true);
      await api.post('/allocations', { roomId: confirmRoom.id, windowId: activeWindow.id });
      toast.success('Room booked successfully.');
      setConfirmRoom(null);
      await loadAll();
      setActiveTab('home');
    } catch (err: any) { 
      toast.error(err.response?.data?.message || 'Booking conflict'); 
      setConfirmRoom(null); 
    } finally { 
      setLoading(false); 
    }
  };

  const cancelBooking = async () => {
    if (!profile?.assignment || !confirm('Cancel your room allocation? This cannot be undone.')) return;
    try {
      setLoading(true);
      await api.delete(`/allocations/${profile.assignment.id}`);
      toast.success('Allocation cancelled.');
      await loadAll();
      loadBooking();
    } catch (err: any) { 
      toast.error(err.response?.data?.message || 'Cancellation rejected'); 
    } finally { 
      setLoading(false); 
    }
  };

  const openRoomToPublic = async () => {
    if (!confirm('Open this room to public booking? Anyone eligible will be able to join.')) return;
    try {
      setLoading(true);
      await api.patch('/student/room/open');
      toast.success('Room opened for booking.');
      await loadAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to open room'); } finally { setLoading(false); }
  };

  const lockRoomForGroup = async () => {
    try {
      setLoading(true);
      await api.patch('/student/room/lock');
      toast.success('Group lock extended for 10 minutes.');
      await loadAll();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to extend lock'); } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    const rt = localStorage.getItem('refreshToken');
    if (rt) try { await api.post('/auth/logout', { refreshToken: rt }); } catch {}
    logout(); router.push('/login');
  };

  const manualRefresh = async () => {
    await Promise.all([loadAll(), activeTab === 'book' ? loadBooking() : Promise.resolve()]);
    toast.success('Status updated', { duration: 1500 });
  };

  const TABS = [
    { id: 'home', label: 'My Allocation', icon: Home },
    { id: 'book', label: 'Browse & Book', icon: CheckCircle2 },
  ] as const;

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A] font-sans text-left">
      {confirmRoom && (
        <BookingConfirmModal 
          room={confirmRoom} 
          hostelName={selectedHostel?.name ?? ''} 
          onConfirm={confirmBooking} 
          onCancel={() => setConfirmRoom(null)} 
        />
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

      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#1A1A1A]/15 px-6 py-3.5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1A1A1A] flex items-center justify-center text-white font-mono font-bold text-xs">
              RQ
            </div>
            <div>
              <p className="font-bold text-base leading-none text-[#1A1A1A]">ResidentIQ</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] mt-0.5">Student Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {lastRefreshed && (
              <button 
                onClick={manualRefresh} 
                title={`Last updated: ${lastRefreshed.toLocaleTimeString()}`}
                className="p-2 border border-[#1A1A1A]/15 rounded hover:border-[#1A1A1A] transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-[#1A1A1A]" />
              </button>
            )}
            <NotificationBell notifications={notifications} onMarkRead={() => loadAll(true)} />
            <button 
              onClick={() => router.push('/settings')} 
              className="p-2 border border-[#1A1A1A]/15 rounded hover:border-[#1A1A1A] transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-[#1A1A1A]" />
            </button>
            <button 
              onClick={handleLogout} 
              className="p-2 border border-[#1A1A1A]/15 rounded hover:border-[#D82C2C] hover:text-[#D82C2C] transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-6 md:p-8">
        
        {/* Student Identification Banner */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1A1A1A]/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 bg-[#D82C2C]"></span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#71717A] font-bold">
                STUDENT PORTAL
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1A1A]">
              {profile?.name ?? 'Student Resident'}
            </h1>
            <p className="text-xs font-mono text-[#71717A] mt-1">
              ROLL: {profile?.rollNumber} • {profile?.program?.toUpperCase()} YEAR {profile?.year} • {profile?.branch}
            </p>
          </div>

          <div className="flex gap-2">
            {TABS.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all border ${
                  activeTab === tab.id 
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-sm' 
                    : 'bg-[#F2F2F2] text-[#1A1A1A] border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <NoticeBanner notices={notices} />

        {/* Real-Time Advisory Strip */}
        <div className="bg-[#F2F2F2] border border-[#1A1A1A]/15 rounded p-4 mb-8 flex items-start gap-3">
          <div className="w-7 h-7 bg-[#1A1A1A] text-white flex items-center justify-center rounded flex-shrink-0 mt-0.5">
            <RefreshCw className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider font-mono text-[#1A1A1A]">
              Real-time Room Booking
            </h3>
            <p className="text-xs text-[#71717A] leading-relaxed mt-0.5">
              Rooms are held in real-time while roommate invitations are pending and automatically released if invitations decline or expire.
            </p>
          </div>
        </div>

        <PendingInvites
          received={receivedInvites}
          sent={sentInvites}
          onRefresh={() => { loadAll(true); loadBooking(); }}
          responseLocked={profile?.assignment?.status === 'confirmed'}
        />

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>

            {activeTab === 'home' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                
                {/* Your Allocated Room (8 cols) */}
                <div className="md:col-span-8 bg-white border border-[#1A1A1A]/15 p-6 sm:p-8 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#1A1A1A]/10">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] font-bold">CURRENT STATUS</span>
                      <h2 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Your Allocated Room</h2>
                    </div>
                    {profile?.assignment?.status === 'confirmed' && (
                      <span className="px-2.5 py-1 bg-[#1A1A1A] text-white text-[10px] font-mono uppercase tracking-widest font-bold rounded">
                        CONFIRMED
                      </span>
                    )}
                  </div>

                  {profile?.assignment?.status === 'confirmed' ? (
                    <div className="space-y-6">
                      
                      {/* Room Showcase */}
                      <div className="bg-[#1A1A1A] text-white p-6 rounded-lg relative overflow-hidden">
                        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                          <div>
                            <span className="text-xs font-mono uppercase tracking-widest text-[#A9B2B1]">ROOM ASSIGNMENT</span>
                            <p className="text-5xl sm:text-6xl font-bold font-mono tracking-tight text-white mt-1">
                              {profile.assignment.room?.roomNumber}
                            </p>
                            <p className="text-sm text-[#A9B2B1] font-mono mt-2">
                              {profile.assignment.room?.hostel?.name} • Floor {profile.assignment.room?.floor ?? 1}
                            </p>
                          </div>
                          <div className="text-left sm:text-right font-mono text-xs text-[#A9B2B1]">
                            <p>CAPACITY: {profile.assignment.room?.capacity} RESIDENTS</p>
                            <p className="text-[#D82C2C] font-bold mt-1">BOOKING ID: #{profile.assignment.id.slice(-6).toUpperCase()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Current Suite Occupants */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[11px] font-mono uppercase tracking-widest text-[#71717A] font-bold">
                            ROOMMATES ({profile.assignment.room?.assignments?.length ?? 0}/{profile.assignment.room?.capacity ?? 0})
                          </span>
                        </div>

                        <div className="space-y-2">
                          {profile.assignment.room?.assignments?.map((a: any) => (
                            <div key={a.id} className="flex items-center justify-between p-3.5 bg-[#F2F2F2] rounded border border-[#1A1A1A]/10">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 bg-[#1A1A1A] text-white rounded flex items-center justify-center font-mono font-bold text-xs">
                                  {a.student?.name?.[0]}
                                </div>
                                <div>
                                  <p className="font-bold text-xs text-[#1A1A1A]">
                                    {a.student?.name} {a.student?.id === profile.id && <span className="text-[#D82C2C] font-mono ml-1">(YOU)</span>}
                                  </p>
                                  <p className="text-[10px] font-mono text-[#71717A]">{a.student?.rollNumber}</p>
                                </div>
                              </div>
                              <CheckCircle2 className="w-4 h-4 text-[#1A1A1A]" />
                            </div>
                          ))}

                          {Array.from({ length: Math.max(0, (profile.assignment.room?.capacity ?? 0) - (profile.assignment.room?.assignments?.length ?? 0)) }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-3 border border-dashed border-[#1A1A1A]/20 rounded text-xs font-mono text-[#71717A]">
                              <span>EMPTY BED #{i + 1}</span>
                              <span className="text-[10px] text-[#A9B2B1]">AVAILABLE</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Room Actions */}
                      {profile.assignment.room?.assignments?.length < profile.assignment.room?.capacity && (
                        <div className="pt-4 border-t border-[#1A1A1A]/10 space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <button 
                              onClick={() => setInviteTargetRoom(profile.assignment.room)} 
                              className="px-4 py-2.5 btn-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Invite Roommate
                            </button>
                            
                            {profile.assignment.bookedAt && 
                             (Date.now() - new Date(profile.assignment.bookedAt).getTime() < 5 * 60 * 1000) && 
                             (!profile.assignment.room?.privateUntil || new Date(profile.assignment.room.privateUntil) <= new Date()) && (
                              <button 
                                onClick={lockRoomForGroup} 
                                className="px-4 py-2.5 btn-secondary text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                              >
                                <Clock className="w-3.5 h-3.5" /> Extend 10m Lock
                              </button>
                            )}

                            {!profile.assignment.room?.isPublic && (
                              <button 
                                onClick={openRoomToPublic} 
                                className="px-4 py-2.5 border border-[#1A1A1A]/20 hover:border-[#1A1A1A] rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5"
                              >
                                <Globe className="w-3.5 h-3.5" /> Open to Public
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-[#1A1A1A]/10">
                        <button 
                          onClick={cancelBooking} 
                          disabled={loading}
                          className="w-full py-2.5 border border-[#D82C2C] text-[#D82C2C] hover:bg-[#D82C2C] hover:text-white rounded font-mono text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                        >
                          Cancel Allocation
                        </button>
                      </div>

                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 bg-[#F2F2F2] border border-[#1A1A1A]/15 rounded flex items-center justify-center mb-3">
                        <Home className="w-6 h-6 text-[#71717A]" />
                      </div>
                      <p className="font-bold text-sm text-[#1A1A1A]">No Room Currently Allocated</p>
                      <p className="text-xs text-[#71717A] max-w-sm mt-1 mb-5">
                        Allocation is open. Select an available room below to book your seat.
                      </p>
                      <button 
                        onClick={() => setActiveTab('book')} 
                        className="px-6 py-2.5 btn-primary text-xs font-bold uppercase tracking-wider"
                      >
                        Browse Available Rooms
                      </button>
                    </div>
                  )}
                </div>

                {/* Allocation Window State (4 cols) */}
                <div className="md:col-span-4 bg-white border border-[#1A1A1A]/15 p-6 sm:p-8 rounded-lg shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 bg-[#D82C2C]"></span>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] font-bold">
                        SCHEDULE
                      </span>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-[#1A1A1A] mb-4">Allocation Window</h2>

                    {activeWindow ? (
                      <div className="space-y-4">
                        <div className={`p-3 rounded border text-xs font-mono font-bold uppercase tracking-wider ${
                          activeWindow.lockedAt 
                            ? 'bg-[#F2F2F2] border-[#D82C2C] text-[#D82C2C]' 
                            : 'bg-[#F2F2F2] border-[#1A1A1A] text-[#1A1A1A]'
                        }`}>
                          {activeWindow.lockedAt ? '🔒 LOCKED — CONTACT WARDEN' : '● ALLOCATION WINDOW OPEN'}
                        </div>
                        <p className="font-bold text-sm text-[#1A1A1A] leading-snug">{activeWindow.name}</p>
                        
                        <div className="pt-3 border-t border-[#1A1A1A]/10 space-y-2 text-xs font-mono text-[#71717A]">
                          <div className="flex justify-between">
                            <span>OPENS:</span>
                            <span className="font-bold text-[#1A1A1A]">{new Date(activeWindow.opensAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>CLOSES:</span>
                            <span className="font-bold text-[#1A1A1A]">{new Date(activeWindow.closesAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs font-mono text-[#71717A]">
                        <Clock className="w-8 h-8 text-[#A9B2B1] mx-auto mb-2" />
                        No allocation window currently open.
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-[#1A1A1A]/10 text-[11px] font-mono text-[#71717A]">
                    First-come, first-served allocation active.
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'book' && (
              <div className="space-y-6">
                {!activeWindow ? (
                  <div className="bg-white border border-[#1A1A1A]/15 p-12 text-center rounded-lg shadow-sm">
                    <Clock className="w-10 h-10 text-[#71717A] mx-auto mb-3" />
                    <p className="font-bold text-lg text-[#1A1A1A]">No Allocation Window Active</p>
                    <p className="text-xs text-[#71717A] font-mono mt-1">Please check back when an allocation window is active.</p>
                  </div>
                ) : profile?.assignment?.status === 'confirmed' ? (
                  <div className="bg-white border-2 border-[#D82C2C] p-10 text-center rounded-lg shadow-sm max-w-lg mx-auto">
                    <div className="w-12 h-12 bg-[#D82C2C]/10 text-[#D82C2C] rounded flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-[#1A1A1A] mb-2">Room Already Booked</h2>
                    <p className="text-xs text-[#71717A] leading-relaxed mb-6 font-mono">
                      You are assigned to Room {profile.assignment.room?.roomNumber}. 
                      To choose a different room, cancel your current allocation first.
                    </p>
                    <button 
                      onClick={cancelBooking} 
                      className="px-6 py-2.5 btn-primary text-xs font-bold uppercase tracking-wider"
                    >
                      Cancel Current Booking
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Hostel Block Selection */}
                    <div>
                      <span className="text-xs font-mono uppercase tracking-widest text-[#71717A] font-bold mb-3 block">
                        STEP 1 // SELECT HOSTEL BLOCK
                      </span>

                      {eligibleHostels.length === 0 ? (
                        <div className="p-8 bg-white border border-[#1A1A1A]/15 rounded text-center text-xs font-mono text-[#71717A]">
                          No eligible hostels found for your program and year.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                          {eligibleHostels.map(h => (
                            <button 
                              key={h.id} 
                              onClick={() => { setSelectedHostel(h); loadRooms(h.id); }}
                              className={`p-5 rounded-lg border text-left transition-all ${
                                selectedHostel?.id === h.id 
                                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md' 
                                  : 'bg-white text-[#1A1A1A] border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded ${
                                  selectedHostel?.id === h.id ? 'bg-[#D82C2C] text-white' : 'bg-[#F2F2F2] text-[#1A1A1A]'
                                }`}>
                                  {h.gender}
                                </span>
                                <span className="font-mono text-xs font-bold">
                                  {h._count?.rooms ?? 0} ROOMS
                                </span>
                              </div>
                              <p className="font-bold text-xl leading-tight mt-1">{h.name}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Room Matrix Selection */}
                    {selectedHostel && (
                      <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                          <div>
                            <span className="text-xs font-mono uppercase tracking-widest text-[#71717A] font-bold">
                              STEP 2 // SELECT ROOM IN {selectedHostel.name.toUpperCase()}
                            </span>
                          </div>
                          
                          {/* Search Input */}
                          <input 
                            value={roomSearch} 
                            onChange={e => setRoomSearch(e.target.value)} 
                            placeholder="Filter by Room Number…"
                            className="w-full sm:w-64 text-xs font-mono" 
                          />
                        </div>

                        {loading ? (
                          <div className="flex justify-center py-16">
                            <Loader2 className="w-6 h-6 animate-spin text-[#D82C2C]" />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {rooms
                              .filter(room => !roomSearch || room.roomNumber.toLowerCase().includes(roomSearch.toLowerCase()))
                              .map(room => {
                                const occupied = room._count?.assignments ?? 0;
                                const available = room.capacity - occupied;
                                const isFull = available === 0;

                                return (
                                  <div 
                                    key={room.id} 
                                    className={`bg-white border p-4 rounded-lg flex flex-col justify-between transition-all ${
                                      isFull 
                                        ? 'border-[#1A1A1A]/10 opacity-50 bg-[#F2F2F2]' 
                                        : 'border-[#1A1A1A]/20 hover:border-[#1A1A1A] shadow-sm'
                                    }`}
                                  >
                                    <div>
                                      <div className="flex justify-between items-baseline mb-2">
                                        <p className="text-2xl font-bold font-mono tracking-tight text-[#1A1A1A]">
                                          {room.roomNumber}
                                        </p>
                                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                          isFull ? 'bg-gray-200 text-gray-600' : 'bg-[#D82C2C]/10 text-[#D82C2C]'
                                        }`}>
                                          {isFull ? 'FULL' : `${available} OPEN`}
                                        </span>
                                      </div>
                                      
                                      <p className="text-xs font-mono text-[#71717A] mb-4">
                                        BEDS: {occupied}/{room.capacity}
                                      </p>
                                    </div>

                                    {!isFull ? (
                                      <div className="flex gap-2">
                                        <button 
                                          onClick={() => initiateBooking(room)} 
                                          className="flex-1 py-2 btn-primary text-xs font-bold uppercase tracking-wider"
                                        >
                                          Book Room
                                        </button>
                                        <button 
                                          onClick={() => setInviteTargetRoom(room)} 
                                          className="p-2 border border-[#1A1A1A]/20 hover:border-[#1A1A1A] rounded text-[#1A1A1A] transition-colors"
                                          title="Invite Roommate"
                                        >
                                          <UserPlus className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <p className="text-center font-mono text-xs text-[#71717A] py-1">
                                        ROOM FULL
                                      </p>
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
