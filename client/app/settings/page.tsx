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
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    setLoading(true);
    try {
      await api.post('/auth/change-password', { oldPassword: form.oldPassword, newPassword: form.newPassword });
      setSuccess(true);
      toast.success('Password updated successfully.');
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally { setLoading(false); }
  };

  const isAdmin = user?.role === 'superadmin' || user?.role === 'warden';
  const dashboardPath = isAdmin ? '/dashboard/admin' : '/dashboard/student';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF] text-[#1A1A1A] p-6 relative font-sans">
      <div className="absolute inset-0 swiss-grid-pattern opacity-40 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 16 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10 text-left"
      >
        <button 
          onClick={() => router.push(dashboardPath)} 
          className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#71717A] hover:text-[#1A1A1A] mb-6 font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>

        <div className="bg-white border border-[#1A1A1A]/20 p-8 sm:p-10 rounded-lg shadow-xl">
          <div className="flex flex-col mb-8 pb-6 border-b border-[#1A1A1A]/10">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 bg-[#D82C2C]"></span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#71717A] font-bold">
                SECURITY SETTINGS
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">Change Password</h1>
            <p className="text-sm text-[#71717A] mt-1">Enter your current password and choose a new password.</p>
          </div>

          {success ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-12 h-12 bg-[#F2F2F2] border border-[#1A1A1A]/20 rounded flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-[#1A1A1A]" />
              </div>
              <p className="font-bold text-lg text-[#1A1A1A]">Password Changed Successfully</p>
              <p className="text-xs text-[#71717A] font-mono mt-1 mb-6">Your password has been updated.</p>
              <button 
                onClick={() => router.push(dashboardPath)} 
                className="w-full btn-primary py-3 text-xs uppercase tracking-wider font-semibold"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#71717A]">Current Password *</label>
                <div className="relative">
                  <input 
                    type={showOld ? 'text' : 'password'} 
                    required 
                    value={form.oldPassword} 
                    onChange={e => setForm(f => ({ ...f, oldPassword: e.target.value }))} 
                    placeholder="Existing password" 
                    className="w-full pr-10 text-sm font-sans" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowOld(!showOld)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#1A1A1A] transition-colors"
                  >
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#71717A]">New Password *</label>
                <div className="relative">
                  <input 
                    type={showNew ? 'text' : 'password'} 
                    required 
                    minLength={8} 
                    value={form.newPassword} 
                    onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} 
                    placeholder="Min. 8 characters" 
                    className="w-full pr-10 text-sm font-sans" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNew(!showNew)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#1A1A1A] transition-colors"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#71717A]">Confirm New Password *</label>
                <input 
                  type="password" 
                  required 
                  value={form.confirmPassword} 
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} 
                  placeholder="Repeat new password" 
                  className="w-full text-sm font-sans" 
                />
                {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                  <p className="text-xs font-mono text-[#D82C2C] mt-1">Passwords do not match</p>
                )}
              </div>

              <button 
                disabled={loading || !form.oldPassword || form.newPassword !== form.confirmPassword || form.newPassword.length < 8}
                className="w-full btn-primary py-3.5 mt-6 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Update Password
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
