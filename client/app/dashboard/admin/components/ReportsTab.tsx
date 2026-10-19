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
    <div className="space-y-8 text-left font-sans">
      <div className="bg-white border border-[#1A1A1A]/15 p-6 sm:p-8 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-[#1A1A1A]/10">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] font-bold">OCCUPANCY</span>
            <h2 className="text-xl font-bold tracking-tight text-[#1A1A1A] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#D82C2C]" /> Hostel Occupancy Report
            </h2>
          </div>
          <div className="flex gap-2">
            <button onClick={loadAll} className="p-2 border border-[#1A1A1A]/15 rounded hover:border-[#1A1A1A] transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4 text-[#1A1A1A]" />
            </button>
            <button onClick={exportCSV} className="px-4 py-2 btn-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {occupancy.map(h => (
            <div key={h.id} className="p-4 bg-[#F2F2F2] border border-[#1A1A1A]/10 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-bold text-sm text-[#1A1A1A]">{h.name}</p>
                  <p className="text-[10px] font-mono text-[#71717A] uppercase font-bold">{h.gender} hostel block</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-mono text-[#D82C2C]">{h.occupancyPct}%</p>
                  <p className="text-[11px] font-mono text-[#71717A]">{h.occupied}/{h.totalCapacity} beds occupied</p>
                </div>
              </div>
              <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div className="h-full bg-[#D82C2C] rounded-full transition-all" style={{ width: `${h.occupancyPct}%` }} />
              </div>
              <p className="text-[11px] font-mono text-[#71717A] mt-1.5">{h.available} beds available</p>
            </div>
          ))}
          {occupancy.length === 0 && <p className="text-center font-mono text-xs text-[#71717A] py-8">No hostel blocks found.</p>}
        </div>
      </div>

      <div className="bg-white border border-[#1A1A1A]/15 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#1A1A1A]/10 flex justify-between items-center bg-[#FFFFFF]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] font-bold">ACTIVITY LOG</span>
            <h2 className="text-lg font-bold tracking-tight text-[#1A1A1A]">Audit Log</h2>
          </div>
          <button onClick={() => setShowAuditLogs(!showAuditLogs)} className="px-3 py-1.5 border border-[#1A1A1A]/20 hover:border-[#1A1A1A] rounded font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors">
            {showAuditLogs ? <><EyeOff className="w-3.5 h-3.5" /> Hide Logs</> : <><Eye className="w-3.5 h-3.5" /> Show Logs</>}
          </button>
        </div>
        {showAuditLogs && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead><tr className="bg-[#F2F2F2] border-b border-[#1A1A1A]/10 font-mono text-[11px] uppercase tracking-wider text-[#71717A]">
                {['Action', 'User', 'Target', 'Date & Time'].map(h => <th key={h} className="px-6 py-3.5 font-bold">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-[#1A1A1A]/10">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[#F2F2F2]/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#1A1A1A]">
                      <span className="px-2 py-0.5 bg-[#F2F2F2] border border-[#1A1A1A]/15 text-[#1A1A1A] text-[10px] rounded uppercase">{log.action}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#1A1A1A]">{log.actorName || 'System Admin'}</p>
                      <p className="text-[10px] font-mono text-[#71717A] uppercase">{log.actorType}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-[#71717A]">{log.entityType} {log.entityId ? `#${log.entityId.slice(0, 8)}…` : ''}</td>
                    <td className="px-6 py-4 font-mono text-[#71717A]">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center font-mono text-xs text-[#71717A]">No audit entries recorded.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
