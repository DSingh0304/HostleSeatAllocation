'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, Eye, EyeOff, User2, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setAuth, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    gender: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user && user.onboardingDone && !user.mustChangePassword) {
      router.replace('/dashboard/student');
    }
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!form.gender) {
      toast.error('Please select your gender');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/onboarding', {
        gender: form.gender,
        newPassword: form.newPassword,
      });

      setAuth(data.token, data.refreshToken);
      updateUser({ mustChangePassword: false, onboardingDone: true });

      toast.success('Profile setup complete.');
      router.push('/dashboard/student');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Profile setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF] text-[#1A1A1A] p-6 relative font-sans">
      <div className="absolute inset-0 swiss-grid-pattern opacity-40 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white border border-[#1A1A1A]/20 p-8 sm:p-10 rounded-lg shadow-xl relative z-10 text-left"
      >
        <div className="flex flex-col mb-8 pb-6 border-b border-[#1A1A1A]/10">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 bg-[#D82C2C]"></span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#71717A] font-bold">
              PROFILE SETUP
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1A1A1A]">
            Complete Your Profile
          </h1>
          <p className="text-sm text-[#71717A] mt-1">
            Please select your gender and set your new password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#71717A]">
              GENDER *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['male', 'female'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm({ ...form, gender: g })}
                  className={`flex items-center justify-center gap-2 py-3 font-semibold text-xs tracking-wider uppercase transition-all rounded border ${
                    form.gender === g
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-sm'
                      : 'bg-[#F2F2F2] text-[#1A1A1A] border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
                  }`}
                >
                  <User2 className="w-4 h-4" />
                  {g.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="text-[11px] font-mono text-[#71717A] mt-1">
              Used to show eligible hostel rooms.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#71717A]">
              NEW PASSWORD *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                className="w-full pr-10 text-sm font-sans"
                placeholder="Minimum 8 characters"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#1A1A1A] transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#71717A]">
              CONFIRM PASSWORD *
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={8}
                className="w-full pr-10 text-sm font-sans"
                placeholder="Re-type new password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#1A1A1A] transition-colors"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="text-xs font-mono text-[#D82C2C] mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            disabled={loading || !form.gender || !form.newPassword || form.newPassword !== form.confirmPassword}
            className="w-full btn-primary py-3.5 mt-6 flex items-center justify-center gap-2 font-semibold text-sm tracking-wide disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Continue to Dashboard <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
