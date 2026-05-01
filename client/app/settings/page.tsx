'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) router.replace('/login');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    setLoading(true);
    try {
      await api.post('/auth/change-password', { oldPassword: form.oldPassword, newPassword: form.newPassword });
      setSuccess(true);
      toast.success('Password changed successfully!');
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally { setLoading(false); }
  };

  const isAdmin = user?.role === 'superadmin' || user?.role === 'warden';
  const dashboardPath = isAdmin ? '/dashboard/admin' : '/dashboard/student';

  const inputClass = (show: boolean) => `w-full px-5 py-4 rounded-2xl bg-foreground/5 border border-transparent focus:border-primary/30 transition-all outline-none font-medium pr-12`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-primary/8 blur-[120px] rounded-full animate-float" />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-secondary/8 blur-[120px] rounded-full animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <button onClick={() => router.push(dashboardPath)} className="flex items-center gap-2 text-foreground/40 hover:text-foreground mb-8 font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="card rounded-[2.5rem] p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-primary/20">
              <Lock className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black">Change Password</h1>
            <p className="text-foreground/50 text-sm mt-2 text-center">Choose a strong password you haven't used before.</p>
          </div>

          {success ? (
            <div className="flex flex-col items-center py-8 gap-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <p className="font-black text-xl text-center">Password Updated!</p>
              <button onClick={() => router.push(dashboardPath)} className="px-8 py-4 btn-primary text-white rounded-2xl font-bold">Back to Dashboard</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-foreground/40 ml-1">Current Password</label>
                <div className="relative">
                  <input type={showOld ? 'text' : 'password'} required value={form.oldPassword} onChange={e => setForm(f => ({ ...f, oldPassword: e.target.value }))} placeholder="Your current password" className={inputClass(showOld)} />
                  <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors">{showOld ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-foreground/40 ml-1">New Password</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} required minLength={8} value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Min. 8 characters" className={inputClass(showNew)} />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors">{showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-foreground/40 ml-1">Confirm New Password</label>
                <input type="password" required value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat new password" className={inputClass(false)} />
                {form.confirmPassword && form.newPassword !== form.confirmPassword && <p className="text-xs text-red-500 ml-1">Passwords do not match</p>}
              </div>

              <button disabled={loading || !form.oldPassword || form.newPassword !== form.confirmPassword || form.newPassword.length < 8}
                className="w-full py-4 btn-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 mt-4 hover:scale-[1.02] transition-transform active:scale-[0.98]">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />} Change Password
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
