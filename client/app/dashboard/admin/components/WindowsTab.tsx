'use client';
import { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle2, XCircle, Lock, Unlock, Clock, Loader2, Info } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const PROGRAMS = ['btech', 'mtech', 'phd'];
const YEARS = [1, 2, 3, 4];

export default function WindowsTab() {
  const [windows, setWindows] = useState<any[]>([]);
  const [hostels, setHostels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    gender: '',
    hostelId: '',
    opensAt: '',
    closesAt: '',
    allowedPrograms: [] as string[],
    allowedYears: [] as number[],
  });

  const load = async () => {
    try {
      const [wRes, hRes] = await Promise.all([
        api.get('/admin/windows'),
        api.get('/admin/hostels'),
      ]);
      setWindows(wRes.data);
      setHostels(hRes.data);
    } catch { toast.error('Failed to load data'); }
  };

  useEffect(() => { load(); }, []);

  const toggleProgram = (p: string) =>
    setForm(f => ({ ...f, allowedPrograms: f.allowedPrograms.includes(p) ? f.allowedPrograms.filter(x => x !== p) : [...f.allowedPrograms, p] }));

  const toggleYear = (y: number) =>
    setForm(f => ({ ...f, allowedYears: f.allowedYears.includes(y) ? f.allowedYears.filter(x => x !== y) : [...f.allowedYears, y] }));

  const createWindow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gender) { toast.error('Please select a gender for this window'); return; }
    try {
      setLoading(true);
      await api.post('/admin/windows', {
        ...form,
        hostelId: form.hostelId || undefined,
      });
      toast.success('Allocation window created!');
      setForm({ name: '', gender: '', hostelId: '', opensAt: '', closesAt: '', allowedPrograms: [], allowedYears: [] });
      load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); } finally { setLoading(false); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try { await api.put(`/admin/windows/${id}/activate`, { isActive: !isActive }); toast.success(isActive ? 'Window deactivated' : 'Window activated'); load(); }
    catch { toast.error('Failed'); }
  };

  const lock = async (id: string) => {
    if (!confirm('Lock this window? Students will no longer be able to book or cancel until you unlock it.')) return;
    try { await api.put(`/admin/windows/${id}/lock`); toast.success('Window locked  only admin overrides allowed'); load(); }
    catch { toast.error('Failed to lock window'); }
  };

  const unlock = async (id: string) => {
    try { await api.put(`/admin/windows/${id}/unlock`); toast.success('Window unlocked  students can book/cancel again'); load(); }
    catch { toast.error('Failed to unlock window'); }
  };

  const deleteWindow = async (id: string) => {
    if (!confirm('Delete this window? This action cannot be undone.')) return;
    try { await api.delete(`/admin/windows/${id}`); toast.success('Window deleted'); load(); }
    catch { toast.error('Failed to delete window'); }
  };

  const inputClass = 'px-4 py-3 rounded-xl bg-foreground/5 border border-transparent focus:border-primary/30 outline-none font-medium w-full';

  const statusBadge = (w: any) => {
    if (w.lockedAt) return <span className="bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</span>;
    if (w.isActive) return <span className="bg-green-500/10 text-green-500 text-[10px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Active</span>;
    return <span className="bg-foreground/5 text-foreground/40 text-[10px] font-black uppercase px-3 py-1 rounded-full">Inactive</span>;
  };

  const eligibilityLabel = (w: any) => {
    const gender = w.gender ? w.gender.charAt(0).toUpperCase() + w.gender.slice(1) : '?';
    const programs = w.allowedPrograms?.length > 0 ? w.allowedPrograms.map((p: string) => p.toUpperCase()).join(', ') : 'All programs';
    const years = w.allowedYears?.length > 0 ? w.allowedYears.map((y: number) => `Y${y}`).join(', ') : 'All years';
    const hostel = w.hostel ? ` • ${w.hostel.name}` : '';
    return `${gender} • ${programs} • ${years}${hostel}`;
  };

  // Filter hostels by selected gender for the hostel dropdown
  const filteredHostels = form.gender
    ? hostels.filter(h => h.gender === form.gender || form.gender === 'mixed' || h.gender === 'mixed')
    : hostels;

  return (
    <div className="space-y-8">

      {/* How it works */}
      <div className="glass p-6 rounded-[2rem] border border-primary/10 bg-primary/5">
        <p className="font-black text-sm text-primary mb-3 flex items-center gap-2"><Info className="w-4 h-4" /> How Allocation Windows Work</p>
        <ol className="text-sm text-foreground/60 space-y-1.5 list-decimal list-inside">
          <li><strong>Create a window</strong>  set gender (required), optional specific hostel, streams, years, and open/close dates.</li>
          <li><strong>Activate</strong>  eligible students can now log in, see their allowed hostel(s), and book a room.</li>
          <li>Students browse available rooms and confirm their booking.</li>
          <li><strong>Lock</strong> the window to freeze all student self-service bookings. Admin overrides still work.</li>
          <li><strong>Deactivate</strong> when the cycle is complete.</li>
        </ol>
      </div>

      {/* Create Window */}
      <div className="glass p-8 rounded-[2.5rem]">
        <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><Calendar className="w-6 h-6 text-primary" /> Create Allocation Window</h2>
        <form onSubmit={createWindow} className="space-y-6">

          {/* Row 1: Name + Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-foreground/40">Window Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. BTech Year 1 Boys – Phase 1" className={inputClass} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-foreground/40">
                Gender * <span className="normal-case text-foreground/30 font-medium">(which students can book)</span>
              </label>
              <div className="flex gap-2">
                {['male', 'female', 'mixed'].map(g => (
                  <button key={g} type="button" onClick={() => setForm(f => ({ ...f, gender: g, hostelId: '' }))}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm capitalize transition-all ${form.gender === g ? 'bg-primary text-white' : 'bg-foreground/5 text-foreground/50 hover:bg-foreground/10'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Hostel (optional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-foreground/40">
              Specific Hostel <span className="normal-case text-foreground/30 font-medium">(optional  leave blank to open all eligible hostels)</span>
            </label>
            <select value={form.hostelId} onChange={e => setForm(f => ({ ...f, hostelId: e.target.value }))} className={inputClass}>
              <option value="">All hostels for selected gender</option>
              {filteredHostels.map(h => (
                <option key={h.id} value={h.id}>{h.name} ({h.gender})</option>
              ))}
            </select>
          </div>

          {/* Row 3: Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-foreground/40">Opens At *</label>
              <input type="datetime-local" value={form.opensAt} onChange={e => setForm(f => ({ ...f, opensAt: e.target.value }))} className={inputClass} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-foreground/40">Closes At *</label>
              <input type="datetime-local" value={form.closesAt} onChange={e => setForm(f => ({ ...f, closesAt: e.target.value }))} className={inputClass} required />
            </div>
          </div>

          {/* Row 4: Programs + Years */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-foreground/40">
                Eligible Streams <span className="normal-case text-foreground/30 font-medium">(empty = all)</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {PROGRAMS.map(p => (
                  <button key={p} type="button" onClick={() => toggleProgram(p)}
                    className={`px-5 py-2 rounded-xl font-bold text-sm uppercase transition-all ${form.allowedPrograms.includes(p) ? 'bg-primary text-white' : 'bg-foreground/5 text-foreground/50 hover:bg-foreground/10'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-foreground/40">
                Eligible Years <span className="normal-case text-foreground/30 font-medium">(empty = all)</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {YEARS.map(y => (
                  <button key={y} type="button" onClick={() => toggleYear(y)}
                    className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${form.allowedYears.includes(y) ? 'bg-primary text-white' : 'bg-foreground/5 text-foreground/50 hover:bg-foreground/10'}`}>
                    Year {y}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading || !form.gender}
            className="w-full py-4 btn-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} Create Window
          </button>
        </form>
      </div>

      {/* Locking info */}
      <div className="glass p-6 rounded-2xl border border-orange-500/20 bg-orange-500/5">
        <p className="font-bold text-sm text-orange-500 mb-1 flex items-center gap-2"><Lock className="w-4 h-4" /> About Allocation Locking</p>
        <p className="text-sm text-foreground/60">When you <strong>lock</strong> a window, students can no longer book or cancel  even if the window is still active. Only admin manual overrides will work. Unlock at any time to restore student self-service.</p>
      </div>

      {/* Windows List */}
      <div className="glass rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-foreground/5"><h2 className="text-xl font-black">Allocation Windows</h2></div>
        <div className="divide-y divide-foreground/5">
          {windows.length === 0
            ? <p className="p-8 text-center text-foreground/40">No windows created yet.</p>
            : windows.map(w => (
              <div key={w.id} className="px-8 py-6 hover:bg-foreground/5 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${w.isActive ? 'bg-green-500/10' : 'bg-foreground/5'}`}>
                      <Clock className={`w-6 h-6 ${w.isActive ? 'text-green-500' : 'text-foreground/30'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <p className="font-black text-lg">{w.name}</p>
                        {statusBadge(w)}
                      </div>
                      <p className="text-xs font-bold text-primary/70 mb-1">{eligibilityLabel(w)}</p>
                      <p className="text-xs text-foreground/40">
                        Opens: {new Date(w.opensAt).toLocaleString()} → Closes: {new Date(w.closesAt).toLocaleString()}
                      </p>
                      {w.lockedAt && <p className="text-xs text-orange-500 mt-1">Locked at: {new Date(w.lockedAt).toLocaleString()}</p>}
                      <p className="text-xs text-foreground/30 mt-1">{w._count?.assignments ?? 0} allocations made</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(w.id, w.isActive)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${w.isActive ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}>
                      {w.isActive ? <><XCircle className="w-4 h-4" /> Deactivate</> : <><CheckCircle2 className="w-4 h-4" /> Activate</>}
                    </button>
                    {w.lockedAt ? (
                      <button onClick={() => unlock(w.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors">
                        <Unlock className="w-4 h-4" /> Unlock
                      </button>
                    ) : (
                      <button onClick={() => lock(w.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-colors">
                        <Lock className="w-4 h-4" /> Lock Allocations
                      </button>
                    )}
                    <button onClick={() => deleteWindow(w.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors">
                      <XCircle className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
