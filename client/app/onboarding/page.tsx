'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, Eye, EyeOff, User2 } from 'lucide-react';
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
  }, [user]);

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

      toast.success('Profile set up successfully! Welcome to ResidentIQ.');
      router.push('/dashboard/student');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md card p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-lg flex items-center justify-center mb-4">
            <ShieldCheck className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2 text-center">Set Up Your Profile</h1>
          <p className="text-muted-foreground text-sm text-center">
            This is required before you can access the hostel portal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Your Gender *</label>
            <div className="flex gap-3">
              {['male', 'female'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm({ ...form, gender: g })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all border ${
                    form.gender === g
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <User2 className="w-4 h-4" />
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              This is used to determine which hostels you are eligible for.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">New Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                className="w-full pr-10"
                placeholder="Min. 8 characters"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Confirm Password *</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={8}
                className="w-full pr-10"
                placeholder="Repeat your new password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="text-xs text-red-600">Passwords do not match</p>
            )}
          </div>

          <button
            disabled={loading || !form.gender || !form.newPassword || form.newPassword !== form.confirmPassword}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Setup & Continue'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
