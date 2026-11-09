'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, useStore } from '@/store/useStore';
import Link from 'next/link';
import { LogIn, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const { setToken, setUser } = useStore();
  const [credential, setCredential] = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // username yoki email — ikkalasini ham username fieldga yuborish
      // (backend email bilan ham qabul qilishi uchun keyinroq handle qilish mumkin)
      const loginRes = await api.post('/auth/login/', {
        username: credential,
        password,
      });
      const { access, refresh } = loginRes.data;
      setToken(access);
      localStorage.setItem('refresh_token', refresh);
      const profileRes = await api.get('/auth/profile/');
      setUser(profileRes.data);
      if (profileRes.data.is_admin || profileRes.data.is_super_admin) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch {
      setError("Username/email yoki parol noto'g'ri kiritildi!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12 min-h-[70vh]">
      <div className="card rounded-3xl p-8 max-w-md w-full flex flex-col gap-6 shadow-xl">

        {/* Header */}
        <div className="flex flex-col gap-2 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-600/30">
            <LogIn size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text)]">Tizimga Kirish</h1>
          <p className="text-sm text-[var(--text-3)]">Mening Uyim hisobingizga kiring</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 text-sm flex items-center gap-2">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username yoki Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[var(--text-2)]">
              Username yoki Email
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              placeholder="username yoki email@example.com"
              value={credential}
              onChange={e => { setCredential(e.target.value); setError(''); }}
              className="glass-input px-4 py-3"
            />
          </div>

          {/* Parol */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[var(--text-2)]">Parol</label>
              <Link href="/register" className="text-xs text-[var(--primary)] hover:underline">
                Parolni unutdingizmi?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Parolingizni kiriting"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className="glass-input px-4 py-3 pr-11 w-full"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text)] transition-colors">
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn btn-primary w-full py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 mt-2 shadow-lg shadow-blue-600/20 disabled:opacity-60">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Kirilmoqda...</>
              : <><LogIn size={16} /> Tizimga kirish</>
            }
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-3)]">
          Hisobingiz yo&apos;qmi?{' '}
          <Link href="/register" className="text-[var(--primary)] hover:underline font-semibold">
            Ro&apos;yxatdan o&apos;ting
          </Link>
        </p>
      </div>
    </div>
  );
}
