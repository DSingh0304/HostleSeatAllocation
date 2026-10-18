'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Building2, User, ShieldCheck, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isAdmin ? '/auth/admin/login' : '/auth/login';
      const payload = isAdmin 
        ? { email: formData.identifier, password: formData.password }
        : { rollNumber: formData.identifier, password: formData.password };

      const { data } = await api.post(endpoint, payload);
      setAuth(data.token, data.refreshToken);
      
      toast.success('Logged in successfully.');

      if (!isAdmin && (data.mustChangePassword || !data.onboardingDone)) {
        router.push('/onboarding');
      } else {
        router.push(isAdmin ? '/dashboard/admin' : '/dashboard/student');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'student' | 'warden') => {
    if (role === 'warden') {
      setIsAdmin(true);
      setFormData({ identifier: 'admin@iiituna.ac.in', password: 'password123' });
    } else {
      setIsAdmin(false);
      setFormData({ identifier: 'TEST1001', password: 'Test@123' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFFFFF] text-[#1A1A1A] p-6 relative font-sans">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 swiss-grid-pattern opacity-40 pointer-events-none"></div>

      {/* Top Header Bar */}
      <header className="w-full max-w-7xl mx-auto flex justify-between items-center py-2 relative z-10">
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-8 h-8 bg-[#1A1A1A] flex items-center justify-center text-white font-mono font-bold text-xs">
            RQ
          </div>
          <span className="font-bold text-lg tracking-tight text-[#1A1A1A]">ResidentIQ</span>
        </Link>
        <Link href="/" className="text-xs font-mono tracking-wider text-[#71717A] hover:text-[#D82C2C] flex items-center gap-1 transition-colors">
          BACK TO HOME <ArrowRight className="w-3 h-3" />
        </Link>
      </header>

      {/* Centered Login Box */}
      <div className="w-full flex items-center justify-center py-10 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-white border border-[#1A1A1A]/20 p-8 sm:p-10 rounded-lg shadow-xl"
        >
          {/* Header Mark */}
          <div className="flex flex-col text-left mb-8 pb-6 border-b border-[#1A1A1A]/10">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 bg-[#D82C2C]"></span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#71717A] font-bold">
                SIGN IN
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">
              Portal Login
            </h1>
            <p className="text-sm text-[#71717A] mt-1">
              Enter your credentials to access your account.
            </p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#F2F2F2] border border-[#1A1A1A]/15 rounded-md mb-6">
            <button 
              type="button"
              onClick={() => { setIsAdmin(false); setFormData({ identifier: '', password: '' }); }}
              className={`flex items-center justify-center gap-2 py-2.5 font-semibold text-xs tracking-wider uppercase transition-all rounded ${
                !isAdmin 
                  ? 'bg-[#1A1A1A] text-white shadow-sm' 
                  : 'text-[#71717A] hover:text-[#1A1A1A]'
              }`}
            >
              <User className="w-4 h-4" /> Student
            </button>
            <button 
              type="button"
              onClick={() => { setIsAdmin(true); setFormData({ identifier: '', password: '' }); }}
              className={`flex items-center justify-center gap-2 py-2.5 font-semibold text-xs tracking-wider uppercase transition-all rounded ${
                isAdmin 
                  ? 'bg-[#1A1A1A] text-white shadow-sm' 
                  : 'text-[#71717A] hover:text-[#1A1A1A]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Warden
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#71717A]">
                {isAdmin ? 'EMAIL ADDRESS' : 'ROLL NUMBER'}
              </label>
              <input 
                type={isAdmin ? 'email' : 'text'}
                required
                className="w-full font-mono text-sm"
                placeholder={isAdmin ? 'warden@iiituna.ac.in' : 'e.g. TEST1001'}
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#71717A]">
                  PASSWORD
                </label>
                <a href="#" className="text-[11px] font-mono text-[#D82C2C] hover:underline">
                  FORGOT?
                </a>
              </div>
              <input 
                type="password"
                required
                className="w-full text-sm font-sans"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button 
              disabled={loading}
              className="w-full btn-primary py-3.5 mt-6 flex items-center justify-center gap-2 font-semibold text-sm tracking-wide disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill Pill */}
          <div className="mt-8 pt-6 border-t border-[#1A1A1A]/10 text-left">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] mb-2 font-bold flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#D82C2C]" /> DEMO CREDENTIALS:
            </p>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => fillDemo('student')}
                className="flex-1 py-1.5 px-2 bg-[#F2F2F2] border border-[#1A1A1A]/15 hover:border-[#1A1A1A] text-[11px] font-mono text-[#1A1A1A] font-semibold rounded text-center transition-colors"
              >
                DEMO STUDENT
              </button>
              <button 
                type="button" 
                onClick={() => fillDemo('warden')}
                className="flex-1 py-1.5 px-2 bg-[#F2F2F2] border border-[#1A1A1A]/15 hover:border-[#1A1A1A] text-[11px] font-mono text-[#1A1A1A] font-semibold rounded text-center transition-colors"
              >
                DEMO WARDEN
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto py-3 border-t border-[#1A1A1A]/10 text-[11px] font-mono text-[#71717A] flex justify-between items-center relative z-10">
        <span>© 2026 IIIT Una • ResidentIQ</span>
        <span className="hidden sm:inline">Hostel Allocation Portal</span>
        <span className="text-[#1A1A1A]">Secure Connection</span>
      </footer>
    </div>
  );
}
