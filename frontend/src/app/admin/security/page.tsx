'use client';

import { useState, useEffect, useMemo } from 'react';
import { api, useStore } from '@/store/useStore';
import {
  Lock, History, ShieldBan, MonitorSmartphone, KeyRound, Copy, Check,
  Users, RefreshCw, Search, ShieldCheck, ShieldAlert,
} from 'lucide-react';

interface UserCredential {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_admin: boolean;
  is_super_admin: boolean;
  date_joined: string;
  last_login: string;
  password_algorithm: string;
}

interface SecurityData {
  login_history: any[];
  blocked_ips: any[];
  user_credentials: UserCredential[];
}

export default function SecurityCenter() {
  const { user } = useStore();
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ipToBlock, setIpToBlock] = useState('');
  const [blockReason, setBlockReason] = useState('');

  // Parolni xavfsiz tiklash holati
  const [selectedUserId, setSelectedUserId] = useState('');
  const [resetMode, setResetMode] = useState<'generate' | 'manual'>('generate');
  const [manualPassword, setManualPassword] = useState('');
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Login ma'lumotlari jadvali uchun qidiruv
  const [credSearch, setCredSearch] = useState('');

  const fetchData = () => {
    setLoading(true);
    api.get('/dashboard/security/')
      .then(res => {
        // Javob kutilgan shaklda bo'lmasa ham sahifa ishdan chiqmasin —
        // har bir ro'yxatni massivga keltiramiz.
        const payload = res.data ?? {};
        setData({
          login_history: Array.isArray(payload.login_history) ? payload.login_history : [],
          blocked_ips: Array.isArray(payload.blocked_ips) ? payload.blocked_ips : [],
          user_credentials: Array.isArray(payload.user_credentials) ? payload.user_credentials : [],
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCredentials = useMemo(() => {
    const list = data?.user_credentials ?? [];
    const q = credSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(c =>
      c.username.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.full_name.toLowerCase().includes(q)
    );
  }, [data, credSearch]);

  const handleBlockIP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipToBlock) return;
    try {
      await api.post('/dashboard/security/block-ip/', { ip_address: ipToBlock, reason: blockReason });
      setIpToBlock('');
      setBlockReason('');
      fetchData();
      alert('IP bloklandi');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xato');
    }
  };

  const handleUnblockIP = async (ip: string) => {
    if (!confirm('Blokdan chiqarilsinmi?')) return;
    try {
      await api.delete('/dashboard/security/block-ip/', { data: { ip_address: ip } });
      fetchData();
    } catch (err) {
      alert('Xato');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      alert('Foydalanuvchini tanlang');
      return;
    }
    if (resetMode === 'manual' && manualPassword.length < 8) {
      alert('Parol kamida 8 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    const target = data?.user_credentials.find(c => String(c.id) === selectedUserId);
    if (!confirm(`"${target?.username || selectedUserId}" foydalanuvchisining paroli tiklanadi. Davom etilsinmi?`)) return;

    setResetting(true);
    setTempPassword(null);
    try {
      const payload: Record<string, unknown> = { user_id: selectedUserId };
      if (resetMode === 'manual') payload.new_password = manualPassword;
      const res = await api.post('/dashboard/change-password/', payload);
      setManualPassword('');
      if (res.data?.temporary_password) {
        setTempPassword(res.data.temporary_password);
      } else {
        alert('Parol muvaffaqiyatli tiklandi!');
      }
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xato');
    } finally {
      setResetting(false);
    }
  };

  const copyTempPassword = async () => {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard mavjud bo'lmasa — foydalanuvchi qo'lda ko'chiradi */
    }
  };

  if (loading || !data) {
    return <div className="animate-pulse h-96 bg-slate-200 dark:bg-white/5 rounded-2xl"></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Lock className="text-rose-500" /> Xavfsizlik Markazi
          </h1>
          <p className="text-sm text-slate-500 mt-1">Tizim xavfsizligi, IP bloklash, login ma'lumotlari va parollarni xavfsiz tiklash</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-xl glass hover:bg-white/10 transition-colors"
        >
          <RefreshCw size={16} /> Yangilash
        </button>
      </div>

      {/* Xavfsizlik holati banneri */}
      <div className="glass p-4 rounded-2xl border-l-4 border-emerald-500 flex items-start gap-3">
        <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={22} />
        <div className="text-sm">
          <p className="font-bold text-slate-800 dark:text-white">Parollar xavfsiz saqlanadi</p>
          <p className="text-slate-500">
            Barcha parollar bir tomonlama xesh (PBKDF2/Argon2) ko'rinishida saqlanadi va hech qanday holatda
            ochiq matnda ko'rsatilmaydi. Kerak bo'lganda parol noldan tiklanadi — vaqtinchalik parol faqat bir marta ko'rsatiladi.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parolni xavfsiz tiklash (Faqat Super Admin) */}
        {user?.is_super_admin && (
          <div className="glass p-6 rounded-2xl flex flex-col gap-4 border-l-4 border-rose-500">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <KeyRound size={20} className="text-rose-500" /> Parolni Xavfsiz Tiklash
            </h2>

            <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Foydalanuvchi</label>
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="w-full glass-input rounded-xl px-4 py-2"
                  required
                >
                  <option value="">— Tanlang —</option>
                  {data.user_credentials.map(c => (
                    <option key={c.id} value={c.id}>
                      #{c.id} · {c.full_name} ({c.username}){c.is_super_admin ? ' · Super Admin' : c.is_admin ? ' · Admin' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 p-1 rounded-xl bg-black/5 dark:bg-white/5">
                <button
                  type="button"
                  onClick={() => setResetMode('generate')}
                  className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${
                    resetMode === 'generate' ? 'bg-rose-500 text-white' : 'text-slate-500'
                  }`}
                >
                  Vaqtinchalik parol yaratish (tavsiya)
                </button>
                <button
                  type="button"
                  onClick={() => setResetMode('manual')}
                  className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${
                    resetMode === 'manual' ? 'bg-rose-500 text-white' : 'text-slate-500'
                  }`}
                >
                  Qo'lda kiritish
                </button>
              </div>

              {resetMode === 'manual' && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Yangi Parol</label>
                  <input
                    type="password"
                    value={manualPassword}
                    onChange={e => setManualPassword(e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-2"
                    placeholder="Yangi parol (min 8 belgi)"
                    minLength={8}
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={resetting}
                className="bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-bold py-2 rounded-xl mt-1 transition-colors"
              >
                {resetting ? 'Bajarilmoqda...' : 'Parolni tiklash'}
              </button>
            </form>

            {/* Vaqtinchalik parol — faqat bir marta ko'rsatiladi */}
            {tempPassword && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex flex-col gap-2">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <ShieldAlert size={14} /> Vaqtinchalik parol (faqat bir marta ko'rsatiladi)
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono font-bold text-sm px-3 py-2 rounded-lg bg-white dark:bg-black/30 select-all break-all">
                    {tempPassword}
                  </code>
                  <button
                    onClick={copyTempPassword}
                    className="p-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors shrink-0"
                    title="Nusxalash"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <button
                  onClick={() => setTempPassword(null)}
                  className="text-[11px] font-bold text-amber-700 dark:text-amber-400 underline self-start"
                >
                  Yashirish
                </button>
              </div>
            )}
          </div>
        )}

        {/* IP Blocklash */}
        <div className="glass p-6 rounded-2xl flex flex-col gap-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShieldBan size={20} className="text-amber-500" /> IP Bloklash
          </h2>
          <form onSubmit={handleBlockIP} className="flex gap-2">
            <input
              type="text"
              value={ipToBlock}
              onChange={e => setIpToBlock(e.target.value)}
              placeholder="192.168.1.1"
              className="flex-1 glass-input rounded-xl px-4 py-2 text-sm"
              required
            />
            <input
              type="text"
              value={blockReason}
              onChange={e => setBlockReason(e.target.value)}
              placeholder="Sabab"
              className="flex-1 glass-input rounded-xl px-4 py-2 text-sm"
            />
            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 rounded-xl transition-colors">
              Blok
            </button>
          </form>
          <div className="mt-2 overflow-y-auto max-h-40">
            {data.blocked_ips.length === 0 ? <p className="text-sm text-slate-500">Bloklangan IP yo'q</p> : (
              <ul className="flex flex-col gap-2">
                {data.blocked_ips.map(b => (
                  <li key={b.id} className="flex justify-between items-center bg-rose-50 dark:bg-rose-900/10 px-3 py-2 rounded-lg border border-rose-100 dark:border-rose-900/30">
                    <div>
                      <span className="font-mono text-sm font-bold text-rose-600">{b.ip}</span>
                      <span className="text-xs text-slate-500 ml-2">{b.reason}</span>
                    </div>
                    <button onClick={() => handleUnblockIP(b.ip)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Ochish</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Login ma'lumotlari (parollar ko'rsatilmaydi) */}
        <div className="glass p-6 rounded-2xl flex flex-col gap-4 lg:col-span-2 border-l-4 border-blue-500">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users size={20} className="text-blue-500" /> Foydalanuvchilar Login Ma'lumotlari
            </h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={credSearch}
                onChange={e => setCredSearch(e.target.value)}
                placeholder="Qidirish (username, email, ism)"
                className="glass-input rounded-xl pl-9 pr-3 py-2 text-sm w-full sm:w-72"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr className="text-slate-500 border-b border-slate-200 dark:border-white/5">
                  <th className="p-3 font-semibold">ID</th>
                  <th className="p-3 font-semibold">Login (username)</th>
                  <th className="p-3 font-semibold">Email</th>
                  <th className="p-3 font-semibold">Rol</th>
                  <th className="p-3 font-semibold">Oxirgi kirish</th>
                  <th className="p-3 font-semibold">Holat</th>
                  <th className="p-3 font-semibold">Parol (xesh turi)</th>
                </tr>
              </thead>
              <tbody>
                {filteredCredentials.length === 0 ? (
                  <tr><td colSpan={7} className="p-4 text-center text-slate-500">Ma'lumot yo'q</td></tr>
                ) : filteredCredentials.map(c => (
                  <tr key={c.id} className="border-b border-slate-100 dark:border-white/5">
                    <td className="p-3 text-slate-400">{c.id}</td>
                    <td className="p-3 font-bold">{c.username}</td>
                    <td className="p-3 text-slate-500">{c.email || '—'}</td>
                    <td className="p-3">
                      {c.is_super_admin ? (
                        <span className="text-xs font-bold px-2 py-1 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">Super Admin</span>
                      ) : c.is_admin ? (
                        <span className="text-xs font-bold px-2 py-1 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">Admin</span>
                      ) : (
                        <span className="text-xs font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">Foydalanuvchi</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-slate-500">{c.last_login || 'Hech qachon'}</td>
                    <td className="p-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                        c.is_active
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                      }`}>
                        {c.is_active ? 'Faol' : 'Bloklangan'}
                      </span>
                    </td>
                    <td className="p-3 text-xs font-mono text-slate-400">🔒 {c.password_algorithm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500">
            Eslatma: parollar bir tomonlama xeshlangani uchun ko'rsatilmaydi. Faqat login ma'lumotlari va parol xesh turi ko'rinadi.
          </p>
        </div>

        {/* Login History */}
        <div className="glass p-6 rounded-2xl flex flex-col gap-4 lg:col-span-2">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <History size={20} className="text-blue-500" /> Oxirgi Xavfsizlik Hodisalari
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr className="text-slate-500 border-b border-slate-200 dark:border-white/5">
                  <th className="p-3 font-semibold">Foydalanuvchi</th>
                  <th className="p-3 font-semibold">Hodisa</th>
                  <th className="p-3 font-semibold">IP Manzil</th>
                  <th className="p-3 font-semibold">Qurilma</th>
                  <th className="p-3 font-semibold text-right">Vaqt</th>
                </tr>
              </thead>
              <tbody>
                {data.login_history.length === 0 ? <tr><td colSpan={5} className="p-4 text-center text-slate-500">Ma'lumot yo'q</td></tr> : data.login_history.map(l => (
                  <tr key={l.id} className="border-b border-slate-100 dark:border-white/5">
                    <td className="p-3 font-medium">{l.user}</td>
                    <td className="p-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                        l.event_type.includes('success') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                        l.event_type.includes('failed') ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                      }`}>
                        {l.event}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs">{l.ip}</td>
                    <td className="p-3 text-xs text-slate-500 flex items-center gap-1"><MonitorSmartphone size={12}/> {l.device || 'Noma\'lum'}</td>
                    <td className="p-3 text-xs text-slate-400 text-right">{l.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
