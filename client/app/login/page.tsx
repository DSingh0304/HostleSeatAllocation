'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, User, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
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
      
      toast.success('Login successful!');

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md card p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-lg flex items-center justify-center mb-4">
            <Building2 className="text-white w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
          <p className="text-muted-foreground text-sm">Enter your credentials to continue</p>
        </div>

        <div className="flex gap-2 p-1 bg-muted rounded-lg mb-6">
          <button 
            onClick={() => setIsAdmin(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-medium transition-all text-sm ${!isAdmin ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
          >
            <User className="w-4 h-4" /> Student
          </button>
          <button 
            onClick={() => setIsAdmin(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-medium transition-all text-sm ${isAdmin ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
          >
            <ShieldCheck className="w-4 h-4" /> Warden
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {isAdmin ? 'Admin Email' : 'Roll Number'}
            </label>
            <input 
              type={isAdmin ? 'email' : 'text'}
              required
              className="w-full"
              placeholder={isAdmin ? 'warden@iiituna.ac.in' : '201xx'}
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Password</label>
            <input 
              type="password"
              required
              className="w-full"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="#" className="text-sm font-medium text-primary hover:underline">Forgot Password?</a>
        </div>
      </motion.div>
    </div>
  );
}
