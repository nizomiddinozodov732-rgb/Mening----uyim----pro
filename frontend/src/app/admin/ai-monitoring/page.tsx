'use client';

import { useState, useEffect } from 'react';
import { api } from '@/store/useStore';
import { Brain, AlertTriangle, Image as ImageIcon, Users, DollarSign, ShieldAlert } from 'lucide-react';

interface AIStats {
  fake_listings: any[];
  fake_count: number;
  suspicious_users: any[];
  suspicious_count: number;
  unusual_prices: any[];
  unusual_count: number;
  duplicate_images: any[];
  duplicate_count: number;
  total_alerts: number;
}

export default function AIMonitoring() {
  const [stats, setStats] = useState<AIStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/ai-monitoring/')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <div className="animate-pulse h-96 bg-slate-200 dark:bg-white/5 rounded-2xl"></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <Brain className="text-violet-500" /> AI Monitoring Markazi
        </h1>
        <p className="text-sm text-slate-500 mt-1">Avtomatik anomaliyalarni aniqlash tizimi</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Soxta E'lonlar", count: stats.fake_count, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
          { title: "Shubhali Userlar", count: stats.suspicious_count, icon: Users, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
          { title: "G'ayrioddiy Narxlar", count: stats.unusual_count, icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { title: "Takroriy Rasmlar", count: stats.duplicate_count, icon: ImageIcon, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
        ].map((c, i) => (
          <div key={i} className="glass p-5 rounded-2xl flex items-center gap-4 border-l-4" style={{ borderLeftColor: c.color.replace('text-', 'var(--') + ')' }}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.bg} ${c.color}`}>
              <c.icon size={24} />
            </div>
            <div>
              <div className="text-2xl font-black">{c.count}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{c.title}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fake Listings */}
        <div className="glass p-6 rounded-2xl flex flex-col gap-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-rose-500">
            <AlertTriangle size={20} /> Ehtimoliy Soxta E'lonlar
          </h2>
          <div className="flex flex-col gap-3">
            {stats.fake_listings.length === 0 ? <p className="text-sm text-slate-500">Toza.</p> : stats.fake_listings.map((l, i) => (
              <div key={i} className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-rose-100 dark:border-rose-900 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-sm truncate">{l.title}</div>
                  <div className="text-xs text-slate-500">Egasi: {l.owner}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/30 px-2 py-1 rounded-md mb-1">{l.reason}</div>
                  <div className="text-xs font-mono">{l.price} UZS</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unusual Prices */}
        <div className="glass p-6 rounded-2xl flex flex-col gap-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-blue-500">
            <DollarSign size={20} /> G'ayrioddiy Narxlar
          </h2>
          <div className="flex flex-col gap-3">
            {stats.unusual_prices.length === 0 ? <p className="text-sm text-slate-500">Barchasi joyida.</p> : stats.unusual_prices.map((p, i) => (
              <div key={i} className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-blue-100 dark:border-blue-900 flex justify-between items-center">
                <div className="truncate pr-4">
                  <div className="font-semibold text-sm truncate">{p.title}</div>
                  <div className="text-xs text-slate-500">O'rtacha narx: {p.avg} UZS</div>
                </div>
                <div className="text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                  {p.price}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suspicious Users */}
        <div className="glass p-6 rounded-2xl flex flex-col gap-4 lg:col-span-2">
          <h2 className="text-lg font-bold flex items-center gap-2 text-amber-500">
            <ShieldAlert size={20} /> Shubhali Foydalanuvchilar (Yangi ochilib, ko'p e'lon qo'ygan)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <th className="pb-3">Ism</th>
                  <th className="pb-3">Qo'shilgan sana</th>
                  <th className="pb-3 text-right">E'lonlar soni</th>
                  <th className="pb-3 text-right">Amal</th>
                </tr>
              </thead>
              <tbody>
                {stats.suspicious_users.length === 0 ? <tr><td colSpan={4} className="py-4 text-slate-500">Toza.</td></tr> : stats.suspicious_users.map((u, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-white/5">
                    <td className="py-3 font-medium">{u.name}</td>
                    <td className="py-3 text-slate-500 text-xs">{u.joined}</td>
                    <td className="py-3 text-right font-bold text-amber-600">{u.listings} ta</td>
                    <td className="py-3 text-right">
                      <button className="text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                        Tekshirish
                      </button>
                    </td>
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
