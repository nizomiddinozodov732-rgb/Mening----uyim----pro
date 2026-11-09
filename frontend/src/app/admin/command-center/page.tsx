'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, useStore } from '@/store/useStore';
import {
  Crown, Users, UserCheck, HardHat, PenTool,
  Building2, DollarSign, AlertTriangle, Server,
  Activity, Shield, RefreshCw, Cpu, HardDrive, LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';

interface CommandStats {
  online_users: number;
  active_sellers: number;
  active_workers: number;
  active_architects: number;
  today_listings: number;
  today_revenue: number;
  pending_complaints: number;
  server: { cpu: number; ram: number; disk: number; status: string };
  recent_payments: { id: number; user: string; amount: string; method: string; status: string; time: string }[];
}

export default function CommandCenter() {
  const [stats, setStats] = useState<CommandStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/command-center/');
      setStats(res.data);
      setLastUpdate(new Date().toLocaleTimeString('uz-UZ'));
    } catch (err) {
      console.error('Error fetching command center stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchStats();
    }, 30000); // 30 sec auto refresh
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading || !stats) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <div key={n} className="h-32 bg-slate-200 dark:bg-white/5 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Online Foydalanuvchilar', value: stats.online_users, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' },
    { title: 'Faol Sotuvchilar', value: stats.active_sellers, icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20' },
    { title: 'Faol Ustalar', value: stats.active_workers, icon: HardHat, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20' },
    { title: 'Faol Arxitektorlar', value: stats.active_architects, icon: PenTool, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/20' },
    { title: "Bugungi E'lonlar", value: stats.today_listings, icon: Building2, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-500/10', border: 'border-sky-200 dark:border-sky-500/20' },
    { title: 'Bugungi Daromad', value: `${(stats.today_revenue).toLocaleString()} so'm`, icon: DollarSign, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-200 dark:border-violet-500/20' },
    { title: 'Kutilayotgan Shikoyatlar', value: stats.pending_complaints, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20' },
    { title: 'Server Holati', value: stats.server.status, icon: Server, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-200 dark:border-teal-500/20' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Crown className="text-amber-500" /> Command Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">Real vaqt rejimida tizim boshqaruvi</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white dark:bg-white/5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10">
          <RefreshCw size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
          Jonli efir: {lastUpdate}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className={`glass-premium p-5 rounded-2xl border ${card.border} flex flex-col gap-3 relative overflow-hidden group`}>
            <div className="flex justify-between items-start">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
                <card.icon size={24} />
              </div>
              {i === 0 && (
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
              )}
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white truncate">
                {card.value}
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">{card.title}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Server resources */}
        <div className="glass p-6 rounded-2xl flex flex-col gap-5">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="text-blue-500" size={20} /> Server Resurslari
          </h2>
          <div className="flex flex-col gap-4">
            {[
              { label: 'CPU Usage', val: stats.server.cpu, icon: Cpu, color: 'bg-blue-500' },
              { label: 'RAM Usage', val: stats.server.ram, icon: LayoutDashboard, color: 'bg-violet-500' },
              { label: 'Disk Space', val: stats.server.disk, icon: HardDrive, color: 'bg-emerald-500' },
            ].map((s, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1 font-medium">
                  <span className="flex items-center gap-1"><s.icon size={14} className="text-slate-400" /> {s.label}</span>
                  <span>{s.val}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} transition-all duration-1000`} style={{ width: `${s.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <DollarSign className="text-emerald-500" size={20} /> So'nggi To'lovlar
            </h2>
            <Link href="/admin/payments" className="text-xs font-semibold text-blue-500 hover:underline">
              Barchasini ko'rish
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <th className="pb-3 font-semibold">Foydalanuvchi</th>
                  <th className="pb-3 font-semibold">Miqdor</th>
                  <th className="pb-3 font-semibold">Usul</th>
                  <th className="pb-3 font-semibold">Vaqt</th>
                  <th className="pb-3 font-semibold text-right">Holat</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_payments.map((p, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-medium">{p.user}</td>
                    <td className="py-3 font-mono">{parseFloat(p.amount).toLocaleString()} so'm</td>
                    <td className="py-3 text-xs uppercase tracking-wider">{p.method}</td>
                    <td className="py-3 text-slate-500 text-xs">{p.time}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${p.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          p.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                            'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                        }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {stats.recent_payments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">Bugun to'lovlar yo'q</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
