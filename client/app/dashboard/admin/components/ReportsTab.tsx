'use client';
import { useState, useEffect } from 'react';
import { BarChart3, Download, RefreshCw, Loader2, Eye, EyeOff } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function ReportsTab() {
  const [occupancy, setOccupancy] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [occ, logs] = await Promise.all([
        api.get('/admin/reports/occupancy'),
        api.get('/admin/audit-logs'),
      ]);
      setOccupancy(occ.data); setAuditLogs(logs.data);
    } catch { toast.error('Failed to load reports'); } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const exportCSV = async () => {
    try {
      const res = await api.get('/admin/reports/export', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'allocations_report.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };


  return (
    <div className="space-y-8">
      {/* Occupancy */}
      <div className="card p-8 rounded-[2.5rem]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black flex items-center gap-3"><BarChart3 className="w-6 h-6 text-primary" /> Occupancy Report</h2>
          <div className="flex gap-3">
            <button onClick={loadAll} className="p-3 card rounded-xl hover:rotate-180 transition-transform duration-500"><RefreshCw className="w-4 h-4 text-primary" /></button>
            <button onClick={exportCSV} className="px-5 py-3 btn-primary text-white rounded-xl font-bold text-sm flex items-center gap-2"><Download className="w-4 h-4" /> Export CSV</button>
          </div>
        </div>
        <div className="space-y-4">
          {occupancy.map(h => (
            <div key={h.id} className="p-5 bg-foreground/5 rounded-2xl">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="font-black">{h.name}</p>
                  <p className="text-xs text-foreground/40 font-bold uppercase">{h.gender}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-primary">{h.occupancyPct}%</p>
                  <p className="text-xs text-foreground/40 font-bold">{h.occupied}/{h.totalCapacity} occupied</p>
                </div>
              </div>
              <div className="h-3 bg-foreground/10 rounded-full overflow-hidden">
                <div className="h-full gradient-bg rounded-full transition-all" style={{ width: `${h.occupancyPct}%` }} />
              </div>
              <p className="text-xs text-foreground/30 mt-2">{h.available} seats available</p>
            </div>
          ))}
          {occupancy.length === 0 && <p className="text-center text-foreground/40 py-8">No hostel data yet.</p>}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="card rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-foreground/5 flex justify-between items-center">
          <h2 className="text-xl font-black">Audit Log</h2>
          <button onClick={() => setShowAuditLogs(!showAuditLogs)} className="px-5 py-3 card hover:bg-foreground/5 rounded-xl font-bold flex flex-shrink-0 items-center gap-2 transition-colors">
            {showAuditLogs ? <><EyeOff className="w-4 h-4" /> Hide Audits</> : <><Eye className="w-4 h-4" /> Show Audits</>}
          </button>
        </div>
        {showAuditLogs && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="text-foreground/30 font-black text-xs uppercase tracking-widest">
                {['Action', 'Actor', 'Target', 'Time'].map(h => <th key={h} className="px-6 py-4">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-foreground/5">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-foreground/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-black text-xs uppercase tracking-wide bg-foreground/10 px-3 py-1 rounded-full">{log.action}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold">{log.actorName || ''}</p>
                      <p className="text-[10px] text-foreground/40 uppercase">{log.actorType}</p>
                    </td>
                    <td className="px-6 py-4 text-foreground/60">{log.entityType} {log.entityId ? `#${log.entityId.slice(0, 8)}…` : ''}</td>
                    <td className="px-6 py-4 text-foreground/40 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-foreground/40">No audit logs yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
