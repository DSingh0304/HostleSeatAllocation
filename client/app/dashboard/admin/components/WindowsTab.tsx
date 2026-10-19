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

  const inputClass = 'px-4 py-2.5 rounded border border-[#1A1A1A]/20 focus:border-[#D82C2C] outline-none font-sans text-xs w-full bg-white';

  const statusBadge = (w: any) => {
    if (w.lockedAt) return <span className="bg-[#1A1A1A] text-white text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1"><Lock className="w-3 h-3 text-[#D82C2C]" /> Locked</span>;
    if (w.isActive) return <span className="bg-[#D82C2C] text-white text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Active</span>;
    return <span className="bg-[#F2F2F2] text-[#71717A] text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded">Inactive</span>;
  };

  const eligibilityLabel = (w: any) => {
    const gender = w.gender ? w.gender.charAt(0).toUpperCase() + w.gender.slice(1) : '?';
    const programs = w.allowedPrograms?.length > 0 ? w.allowedPrograms.map((p: string) => p.toUpperCase()).join(', ') : 'All programs';
    const years = w.allowedYears?.length > 0 ? w.allowedYears.map((y: number) => `Y${y}`).join(', ') : 'All years';
    const hostel = w.hostel ? ` • ${w.hostel.name}` : '';
    return `${gender} • ${programs} • ${years}${hostel}`;
  };

  const filteredHostels = form.gender
    ? hostels.filter(h => h.gender === form.gender || form.gender === 'mixed' || h.gender === 'mixed')
    : hostels;

  return (
    <div className="space-y-8 text-left font-sans">

      <div className="bg-[#F2F2F2] border border-[#1A1A1A]/15 p-5 rounded-lg">
        <p className="font-mono font-bold text-xs uppercase tracking-wider text-[#1A1A1A] mb-2 flex items-center gap-2">
          <Info className="w-4 h-4 text-[#D82C2C]" /> ABOUT ALLOCATION WINDOWS
        </p>
        <ol className="text-xs text-[#71717A] space-y-1 list-decimal list-inside font-mono">
          <li><strong>Create window:</strong> Set eligible gender, hostel block, program/year, and start/end dates.</li>
          <li><strong>Activation:</strong> Eligible students can select and book their rooms.</li>
          <li><strong>Locking:</strong> Pauses room bookings and cancellations for administrative review.</li>
          <li><strong>Deactivation:</strong> Closes the allocation window.</li>
        </ol>
      </div>

      <div className="bg-white border border-[#1A1A1A]/15 p-6 sm:p-8 rounded-lg shadow-sm">
        <div className="mb-6 pb-4 border-b border-[#1A1A1A]/10">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] font-bold">NEW WINDOW</span>
          <h2 className="text-xl font-bold tracking-tight text-[#1A1A1A] flex items-center gap-2 mt-1">
            <Calendar className="w-5 h-5 text-[#D82C2C]" /> Create Allocation Window
          </h2>
        </div>

        <form onSubmit={createWindow} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#71717A]">Window Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. BTech Year 1 Boys – Phase 1" className={inputClass} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#71717A]">
                Gender *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['male', 'female', 'mixed'].map(g => (
                  <button key={g} type="button" onClick={() => setForm(f => ({ ...f, gender: g, hostelId: '' }))}
                    className={`py-2 rounded font-mono font-bold text-xs uppercase tracking-wider border transition-all ${
                      form.gender === g 
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' 
                        : 'bg-[#F2F2F2] text-[#1A1A1A] border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
                    }`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#71717A]">
              Hostel Block <span className="normal-case text-[#71717A] font-normal">(Leave blank to open all eligible blocks)</span>
            </label>
            <select value={form.hostelId} onChange={e => setForm(f => ({ ...f, hostelId: e.target.value }))} className={inputClass}>
              <option value="">All blocks matching gender</option>
              {filteredHostels.map(h => (
                <option key={h.id} value={h.id}>{h.name} ({h.gender})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#71717A]">Start Date & Time *</label>
              <input type="datetime-local" value={form.opensAt} onChange={e => setForm(f => ({ ...f, opensAt: e.target.value }))} className={inputClass} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#71717A]">End Date & Time *</label>
              <input type="datetime-local" value={form.closesAt} onChange={e => setForm(f => ({ ...f, closesAt: e.target.value }))} className={inputClass} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#71717A]">Eligible Programs (empty = all)</label>
              <div className="flex gap-2 flex-wrap">
                {PROGRAMS.map(p => (
                  <button key={p} type="button" onClick={() => toggleProgram(p)}
                    className={`px-3 py-1.5 rounded font-mono font-bold text-xs uppercase tracking-wider border transition-all ${
                      form.allowedPrograms.includes(p) 
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' 
                        : 'bg-[#F2F2F2] text-[#1A1A1A] border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#71717A]">Eligible Years (empty = all)</label>
              <div className="flex gap-2 flex-wrap">
                {YEARS.map(y => (
                  <button key={y} type="button" onClick={() => toggleYear(y)}
                    className={`px-3 py-1.5 rounded font-mono font-bold text-xs uppercase tracking-wider border transition-all ${
                      form.allowedYears.includes(y) 
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' 
                        : 'bg-[#F2F2F2] text-[#1A1A1A] border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
                    }`}>
                    Year {y}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading || !form.gender}
            className="w-full btn-primary py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Allocation Window
          </button>
        </form>
      </div>

      <div className="bg-white border border-[#1A1A1A]/15 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#1A1A1A]/10 flex justify-between items-center bg-[#FFFFFF]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] font-bold">ALL WINDOWS</span>
            <h2 className="text-lg font-bold tracking-tight text-[#1A1A1A]">Allocation Windows</h2>
          </div>
        </div>

        <div className="divide-y divide-[#1A1A1A]/10">
          {windows.length === 0
            ? <p className="p-8 text-center font-mono text-xs text-[#71717A]">No windows created yet.</p>
            : windows.map(w => (
              <div key={w.id} className="p-6 hover:bg-[#F2F2F2]/50 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded border border-[#1A1A1A]/15 bg-[#F2F2F2] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-5 h-5 text-[#1A1A1A]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-base text-[#1A1A1A]">{w.name}</p>
                        {statusBadge(w)}
                      </div>
                      <p className="text-xs font-mono text-[#D82C2C] font-semibold mb-1">{eligibilityLabel(w)}</p>
                      <p className="text-xs font-mono text-[#71717A]">
                        Window: {new Date(w.opensAt).toLocaleString()} → {new Date(w.closesAt).toLocaleString()}
                      </p>
                      <p className="text-[11px] font-mono text-[#71717A] mt-1">{w._count?.assignments ?? 0} confirmed allocations</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={() => toggleActive(w.id, w.isActive)}
                      className={`px-3 py-1.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition-colors border ${
                        w.isActive 
                          ? 'border-[#D82C2C] text-[#D82C2C] hover:bg-[#D82C2C] hover:text-white' 
                          : 'border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white'
                      }`}>
                      {w.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    {w.lockedAt ? (
                      <button onClick={() => unlock(w.id)} className="px-3 py-1.5 rounded font-mono text-xs font-bold uppercase tracking-wider border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors">
                        Unlock
                      </button>
                    ) : (
                      <button onClick={() => lock(w.id)} className="px-3 py-1.5 rounded font-mono text-xs font-bold uppercase tracking-wider border border-[#D82C2C] text-[#D82C2C] hover:bg-[#D82C2C] hover:text-white transition-colors">
                        Lock
                      </button>
                    )}
                    <button onClick={() => deleteWindow(w.id)} className="p-1.5 text-[#D82C2C] hover:bg-[#D82C2C]/10 rounded transition-colors" title="Delete">
                      <XCircle className="w-4 h-4" />
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
