'use client';

import { useState, useEffect } from 'react';
import { api, useStore } from '@/store/useStore';
import { Lock, History, ShieldBan, MonitorSmartphone, CheckCircle, XCircle } from 'lucide-react';

interface SecurityData {
  login_history: any[];
  blocked_ips: any[];
}

export default function SecurityCenter() {
  const { user } = useStore();
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ipToBlock, setIpToBlock] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [passwordForm, setPasswordForm] = useState({ userId: '', newPassword: '' });

  const fetchData = () => {
    setLoading(true);
    api.get('/dashboard/security/')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.userId || passwordForm.newPassword.length < 6) {
      alert('ID va kamida 6 belgili parol kerak');
      return;
    }
    if (!confirm('Rostdan ham parolni o\'zgartirmoqchimisiz?')) return;
    try {
      await api.post('/dashboard/change-password/', { user_id: passwordForm.userId, new_password: passwordForm.newPassword });
      setPasswordForm({ userId: '', newPassword: '' });
      alert("Parol muvaffaqiyatli o'zgartirildi!");
    } catch (err: any) {
      alert(err.response?.data?.error || 'Xato');
    }
  };

  if (loading || !data) {
    return <div className="animate-pulse h-96 bg-slate-200 dark:bg-white/5 rounded-2xl"></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <Lock className="text-rose-500" /> Xavfsizlik Markazi
        </h1>
        <p className="text-sm text-slate-500 mt-1">Tizim xavfsizligi, IP bloklash va parollarni boshqarish</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parol o'zgartirish (Faqat Super Admin) */}
        {user?.is_super_admin && (
          <div className="glass p-6 rounded-2xl flex flex-col gap-4 border-l-4 border-rose-500">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Lock size={20} className="text-rose-500" /> Boshqa Admin/User Parolini O'zgartirish
            </h2>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Foydalanuvchi ID</label>
                <input 
                  type="number" 
                  value={passwordForm.userId}
                  onChange={e => setPasswordForm({...passwordForm, userId: e.target.value})}
                  className="w-full glass-input rounded-xl px-4 py-2"
                  placeholder="Masalan: 1"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Yangi Parol</label>
                <input 
                  type="password" 
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="w-full glass-input rounded-xl px-4 py-2"
                  placeholder="Yangi parol (min 6 belgi)"
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 rounded-xl mt-2 transition-colors">
                O'zgartirish
              </button>
            </form>
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
