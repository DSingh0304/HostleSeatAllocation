'use client';
import { useState, useEffect } from 'react';
import { Users, Plus, Search, Trash2, RefreshCw, Upload, Loader2, KeyRound, GraduationCap, UserMinus } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function StudentsTab() {
  const [view, setView] = useState<'students' | 'teachers'>('students');
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ year: '', branch: '', program: '' });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState(false);

  const [studentForm, setStudentForm] = useState({ rollNumber: '', name: '', email: '', year: '', branch: '', program: 'btech', gender: '', phone: '', priorityTier: '0' });
  const [teacherForm, setTeacherForm] = useState({ employeeId: '', name: '', email: '', gender: 'male', department: '', phone: '' });
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showTeacherForm, setShowTeacherForm] = useState(false);

  const loadStudents = async (p = 1) => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/students', { params: { search: search || undefined, ...filters, page: p, limit: 50 } });
      setStudents(data.students); setTotal(data.total); setPage(p); setLoaded(true);
    } catch { toast.error('Failed to load students'); } finally { setLoading(false); }
  };

  const loadTeachers = async () => {
    try { setLoading(true); const { data } = await api.get('/admin/teachers'); setTeachers(data); setLoaded(true); } 
    catch { toast.error('Failed to load teachers'); } finally { setLoading(false); }
  };

  const createStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/admin/students', { ...studentForm, year: parseInt(studentForm.year), priorityTier: parseInt(studentForm.priorityTier) });
      toast.success(`Student ${studentForm.name} created. Default password: ${studentForm.rollNumber}@iiituna`);
      setStudentForm({ rollNumber: '', name: '', email: '', year: '', branch: '', program: 'btech', gender: '', phone: '', priorityTier: '0' });
      setShowStudentForm(false); loadStudents();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); } finally { setLoading(false); }
  };

  const createTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/admin/teachers', teacherForm);
      toast.success(`Teacher ${teacherForm.name} created. Default password: ${teacherForm.employeeId}@iiituna`);
      setTeacherForm({ employeeId: '', name: '', email: '', gender: 'male', department: '', phone: '' });
      setShowTeacherForm(false); loadTeachers();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); } finally { setLoading(false); }
  };

  const deleteStudent = async (id: string, name: string) => {
    if (!confirm(`Delete student "${name}"? This cannot be undone.`)) return;
    try { await api.delete(`/admin/students/${id}`); toast.success('Student deleted'); loadStudents(page); } 
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const unallocate = async (assignmentId: string, name: string) => {
    if (!confirm(`Remove ${name} from their allocated room?`)) return;
    try { await api.delete(`/admin/allocations/${assignmentId}`); toast.success('Room unallocated'); if(view==='students') loadStudents(page); else loadTeachers(); }
    catch(err:any){ toast.error(err.response?.data?.message || 'Failed'); }
  };

  const deleteTeacher = async (id: string, name: string) => {
    if (!confirm(`Delete teacher "${name}"?`)) return;
    try { await api.delete(`/admin/teachers/${id}`); toast.success('Teacher deleted'); loadTeachers(); } 
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const resetPassword = async (id: string, type: 'student' | 'teacher', name: string) => {
    const newPassword = prompt(`Enter new password for ${name} (min 8 chars):`);
    if (!newPassword || newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    try {
      await api.post('/auth/admin/reset-password', { targetId: id, targetType: type, newPassword });
      toast.success(`Password reset for ${name}. They must change it on next login.`);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const formData = new FormData(); formData.append('file', file);
    try {
      setLoading(true);
      const { data } = await api.post('/admin/students/bulk', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Imported ${data.created} students${data.skipped > 0 ? `, skipped ${data.skipped}` : ''}`);
      if (data.errors?.length) { console.warn('Import errors:', data.errors); toast.error(`${data.errors.length} row(s) had errors. Check console for details.`); }
      loadStudents();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Import failed'); } finally { setLoading(false); e.target.value = ''; }
  };

  const inputClass = 'px-4 py-3 rounded-xl bg-foreground/5 border border-transparent focus:border-primary/30 outline-none font-medium';

  useEffect(() => {
    if (view === 'students') loadStudents();
    else if (view === 'teachers') loadTeachers();
  }, [view]);

  if (!loaded) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-foreground/40 font-bold">Loading...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex p-1 bg-foreground/5 rounded-2xl w-fit">
        {(['students', 'teachers'] as const).map(t => (
          <button key={t} onClick={() => setView(t)}
            className={`px-6 py-3 rounded-xl font-bold capitalize transition-all ${view === t ? 'bg-primary text-white shadow-lg' : 'text-foreground/40'}`}>{t}</button>
        ))}
      </div>

      {view === 'students' && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-3 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadStudents()} placeholder="Search by name, roll, email…" className="w-full pl-10 pr-4 py-3 rounded-xl bg-foreground/5 border border-transparent focus:border-primary/20 outline-none text-sm font-medium" />
              </div>
              <select value={filters.year} onChange={e => setFilters(f => ({ ...f, year: e.target.value }))} className="px-4 py-3 rounded-xl bg-foreground/5 text-sm font-medium outline-none">
                <option value="">All Years</option>{[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
              <select value={filters.program} onChange={e => setFilters(f => ({ ...f, program: e.target.value }))} className="px-4 py-3 rounded-xl bg-foreground/5 text-sm font-medium outline-none">
                <option value="">All Programs</option><option value="btech">BTech</option><option value="mtech">MTech</option><option value="phd">PhD</option>
              </select>
              <button onClick={() => loadStudents()} className="px-4 py-3 btn-primary text-white rounded-xl font-bold text-sm"><Search className="w-4 h-4" /></button>
            </div>
            <div className="flex gap-3">
              <label className="px-5 py-3 card rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer hover:bg-foreground/5 transition-all">
                <Upload className="w-4 h-4" /> CSV Import
                <input type="file" accept=".csv" className="hidden" onChange={handleBulkImport} />
              </label>
              <button onClick={() => setShowStudentForm(!showStudentForm)} className="px-5 py-3 btn-primary text-white rounded-xl font-bold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Student
              </button>
            </div>
          </div>

          {/* Create Student Form */}
          {showStudentForm && (
            <div className="card p-8 rounded-[2rem] border border-primary/20">
              <h3 className="font-black text-xl mb-6">New Student Account</h3>
              <form onSubmit={createStudent} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[['Roll Number *', 'rollNumber', 'text', '20101'], ['Full Name *', 'name', 'text', 'John Doe'], ['Email *', 'email', 'email', 'john@example.com'], ['Phone', 'phone', 'tel', '+91 98765 43210']].map(([label, key, type, ph]) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-foreground/40">{label}</label>
                    <input type={type} value={(studentForm as any)[key]} onChange={e => setStudentForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} className={inputClass} required={label.includes('*')} />
                  </div>
                ))}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-foreground/40">Year *</label>
                  <select value={studentForm.year} onChange={e => setStudentForm(f => ({ ...f, year: e.target.value }))} className={inputClass} required>
                    <option value="">Select year</option>{[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-foreground/40">Program *</label>
                  <select value={studentForm.program} onChange={e => setStudentForm(f => ({ ...f, program: e.target.value }))} className={inputClass}>
                    <option value="btech">BTech</option><option value="mtech">MTech</option><option value="phd">PhD</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-foreground/40">Branch *</label>
                  <input value={studentForm.branch} onChange={e => setStudentForm(f => ({ ...f, branch: e.target.value }))} placeholder="CSE / ECE / ME…" className={inputClass} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-foreground/40">Priority Tier</label>
                  <select value={studentForm.priorityTier} onChange={e => setStudentForm(f => ({ ...f, priorityTier: e.target.value }))} className={inputClass}>
                    <option value="0">Normal (0)</option><option value="1">Medical (1)</option><option value="2">PwD (2)</option>
                  </select>
                </div>
                <div className="col-span-full">
                  <button type="submit" disabled={loading} className="w-full py-4 btn-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} Create Student (default password: rollNumber@iiituna)
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Student Table */}
          <div className="card rounded-[2.5rem] overflow-hidden">
            <div className="p-6 border-b border-foreground/5 flex justify-between items-center">
              <p className="font-bold">{total} students total</p>
              <button onClick={() => loadStudents(page)} className="p-2 card rounded-xl hover:rotate-180 transition-transform duration-500"><RefreshCw className="w-4 h-4 text-primary" /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="text-foreground/30 font-black text-xs uppercase tracking-widest">
                  {['Student', 'Roll No', 'Year', 'Program', 'Branch', 'Gender', 'Allocation', 'Actions'].map(h => <th key={h} className="px-6 py-4">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-foreground/5">
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-foreground/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center font-black text-foreground/40 text-sm">{s.name[0]}</div>
                          <div><p className="font-bold">{s.name}</p><p className="text-foreground/40 text-xs">{s.email}</p></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold">{s.rollNumber}</td>
                      <td className="px-6 py-4 text-foreground/60">Yr {s.year}</td>
                      <td className="px-6 py-4"><span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-primary/10 text-primary">{s.program}</span></td>
                      <td className="px-6 py-4 text-foreground/60">{s.branch}</td>
                      <td className="px-6 py-4 text-foreground/60 capitalize">{s.gender || <span className="text-orange-500 font-bold">Not set</span>}</td>
                      <td className="px-6 py-4">
                        {s.assignment ? <span className="text-green-500 font-bold text-xs">Room {s.assignment.room?.roomNumber} • {s.assignment.room?.hostel?.name}</span> : <span className="text-foreground/30 text-xs"></span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {s.assignment && <button onClick={() => unallocate(s.assignment.id, s.name)} title="Unallocate Room" className="p-2 card rounded-lg text-orange-500 hover:bg-orange-500/10 transition-colors"><UserMinus className="w-4 h-4" /></button>}
                          <button onClick={() => resetPassword(s.id, 'student', s.name)} title="Reset password" className="p-2 card rounded-lg text-foreground/40 hover:text-primary transition-colors"><KeyRound className="w-4 h-4" /></button>
                          <button onClick={() => deleteStudent(s.id, s.name)} title="Delete student" className="p-2 card rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && <tr><td colSpan={8} className="px-6 py-12 text-center text-foreground/40">No students found. Try loading or adjusting filters.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === 'teachers' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setShowTeacherForm(!showTeacherForm)} className="px-5 py-3 btn-primary text-white rounded-xl font-bold text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Teacher
            </button>
          </div>
          {showTeacherForm && (
            <div className="card p-8 rounded-[2rem] border border-primary/20">
              <h3 className="font-black text-xl mb-6">New Teacher Account</h3>
              <form onSubmit={createTeacher} className="grid grid-cols-2 gap-4">
                {[['Employee ID *', 'employeeId', 'text', 'EMP001'], ['Full Name *', 'name', 'text', 'Dr. Jane Smith'], ['Email *', 'email', 'email', 'jane@iiituna.ac.in'], ['Department *', 'department', 'text', 'CSE'], ['Phone', 'phone', 'tel', '+91 98765 43210']].map(([label, key, type, ph]) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-foreground/40">{label}</label>
                    <input type={type} value={(teacherForm as any)[key]} onChange={e => setTeacherForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} className={inputClass} required={label.includes('*')} />
                  </div>
                ))}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-foreground/40">Gender *</label>
                  <select value={teacherForm.gender} onChange={e => setTeacherForm(f => ({ ...f, gender: e.target.value }))} className={inputClass}>
                    <option value="male">Male</option><option value="female">Female</option>
                  </select>
                </div>
                <div className="col-span-full">
                  <button type="submit" disabled={loading} className="w-full py-4 btn-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} Create Teacher (default password: employeeId@iiituna)
                  </button>
                </div>
              </form>
            </div>
          )}
          <div className="card rounded-[2.5rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="text-foreground/30 font-black text-xs uppercase tracking-widest">
                  {['Teacher', 'Employee ID', 'Department', 'Gender', 'Allocation', 'Actions'].map(h => <th key={h} className="px-6 py-4">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-foreground/5">
                  {teachers.map(t => (
                    <tr key={t.id} className="hover:bg-foreground/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center font-black text-foreground/40 text-sm">{t.name[0]}</div>
                          <div><p className="font-bold">{t.name}</p><p className="text-foreground/40 text-xs">{t.email}</p></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold">{t.employeeId}</td>
                      <td className="px-6 py-4 text-foreground/60">{t.department}</td>
                      <td className="px-6 py-4 text-foreground/60 capitalize">{t.gender}</td>
                      <td className="px-6 py-4">{t.assignment ? <span className="text-green-500 font-bold text-xs">Room {t.assignment.room?.roomNumber} • {t.assignment.room?.hostel?.name}</span> : <span className="text-foreground/30 text-xs"></span>}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {t.assignment && <button onClick={() => unallocate(t.assignment.id, t.name)} title="Unallocate Room" className="p-2 card rounded-lg text-orange-500 hover:bg-orange-500/10 transition-colors"><UserMinus className="w-4 h-4" /></button>}
                          <button onClick={() => resetPassword(t.id, 'teacher', t.name)} className="p-2 card rounded-lg text-foreground/40 hover:text-primary transition-colors"><KeyRound className="w-4 h-4" /></button>
                          <button onClick={() => deleteTeacher(t.id, t.name)} className="p-2 card rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {teachers.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-foreground/40">No teachers yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
