'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, useStore } from '@/store/useStore';
import Link from 'next/link';
import {
  Users, Building2, CreditCard, AlertTriangle,
  TrendingUp, Star, ShieldCheck, Package, Hammer,
  ArrowUpRight, ArrowDownRight, UserPlus,
  Activity, Clock, RefreshCw, Settings, Wifi,
} from 'lucide-react';

interface Stats {
  total_users: number;
  total_properties: number;
  total_complaints: number;
  total_revenue: number;
  total_materials: number;
  total_stores: number;
  total_providers: number;
  total_ratings: number;
  new_users_today: number;
  new_users_week: number;
  new_properties_week: number;
  pending_complaints: number;
  active_properties: number;
  month_revenue: number;
  payments_chart: { name: string; date: string; amount: number }[];
  profession_stats: { name: string; code: string; count: number }[];
  property_type_stats: { name: string; code: string; count: number }[];
  recent_activity: { type: string; text: string; time: string; icon: string }[];
  online_users?: number;
}

export default function AdminDashboard() {
  const { user } = useStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/stats/');
      setStats(res.data);
      setLastUpdate(new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds, only when tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading || !stats) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 bg-white dark:bg-white/5 rounded-2xl animate-pulse border border-slate-100 dark:border-white/5"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-white dark:bg-white/5 rounded-2xl animate-pulse border border-slate-100 dark:border-white/5"></div>
          <div className="h-80 bg-white dark:bg-white/5 rounded-2xl animate-pulse border border-slate-100 dark:border-white/5"></div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Foydalanuvchilar', value: stats.total_users,
      sub: `+${stats.new_users_today} bugun`, icon: Users,
      color: 'text-blue-500', trend: stats.new_users_today > 0 ? 'up' : 'neutral'
    },
    {
      title: "Faol E'lonlar", value: stats.active_properties,
      sub: `+${stats.new_properties_week} hafta`, icon: Building2,
      color: 'text-emerald-500', trend: stats.new_properties_week > 0 ? 'up' : 'neutral'
    },
    {
      title: 'Oylik Daromad', value: `${(stats.month_revenue / 1000000).toFixed(1)}M`,
      sub: `Jami: ${(stats.total_revenue / 1000000).toFixed(1)}M UZS`, icon: CreditCard,
      color: 'text-violet-500', trend: 'up'
    },
    {
      title: 'Shikoyatlar', value: stats.pending_complaints,
      sub: `Jami: ${stats.total_complaints}`, icon: AlertTriangle,
      color: 'text-rose-500', trend: stats.pending_complaints > 0 ? 'down' : 'neutral'
    },
  ];

  // Calculate max for chart bar heights
  const chartMax = Math.max(...stats.payments_chart.map(d => d.amount), 1);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-500 text-sm">
            Assalomu alaykum, {user?.first_name}! Platformaning umumiy holati.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <RefreshCw size={12} className="animate-spin" style={{ animationDuration: '3s' }} />
          <span>Oxirgi yangilanish: {lastUpdate}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white dark:bg-[#10101f] p-5 rounded-2xl border border-slate-100 dark:border-white/5 flex flex-col gap-3 group transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex justify-center items-center ${card.color} transition-transform group-hover:scale-110`}>
                  <Icon size={20} />
                </div>
                {card.trend === 'up' && <ArrowUpRight size={16} className="text-emerald-500" />}
                {card.trend === 'down' && <ArrowDownRight size={16} className="text-rose-500" />}
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{card.value}</span>
                <span className="text-[13px] font-semibold text-slate-500">{card.title}</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">{card.sub}</span>
            </div>
          );
        })}
      </div>

      {/* Second row: Mini stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Materiallar', value: stats.total_materials, icon: Package },
          { label: 'Ustalar', value: stats.total_providers, icon: Hammer },
          { label: 'Baholar', value: stats.total_ratings, icon: Star },
          { label: "Do'konlar", value: stats.total_stores, icon: ShieldCheck },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white dark:bg-[#10101f] px-5 py-4 rounded-xl border border-slate-100 dark:border-white/5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <Icon size={20} className="text-slate-400" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-slate-800 dark:text-white leading-tight">{item.value}</span>
                <span className="text-[11px] text-slate-500 font-medium">{item.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#10101f] rounded-2xl border border-slate-100 dark:border-white/5 p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <TrendingUp className="text-slate-400" size={18} /> Haftalik Daromad
              </h2>
            </div>
          </div>

          {/* CSS Bar Chart */}
          <div className="flex items-end justify-between gap-1 h-48 mt-2 w-full max-w-2xl mx-auto">
            {stats.payments_chart.map((day, idx) => {
              const height = chartMax > 0 ? (day.amount / chartMax) * 100 : 5;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-medium opacity-0 hover:opacity-100 transition-opacity">
                    {day.amount > 0 ? `${(day.amount / 1000).toFixed(0)}k` : '0'}
                  </span>
                  <div className="w-full flex justify-center h-full items-end">
                    <div
                      className="w-full max-w-[24px] bg-blue-500/80 hover:bg-blue-600 rounded-t-md transition-all duration-300"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    ></div>
                  </div>
                  <div className="text-center mt-1">
                    <span className="text-xs font-semibold text-slate-500">{day.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Foydalanuvchilar taqsimoti */}
        <div className="bg-white dark:bg-[#10101f] rounded-2xl border border-slate-100 dark:border-white/5 p-6 flex flex-col gap-5">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="text-slate-400" size={18} /> Kasblar bo&apos;yicha
          </h2>
          <div className="flex flex-col gap-4 flex-1">
            {stats.profession_stats.map((prof, idx) => {
              const percentage = stats.total_users > 0 ? Math.round((prof.count / stats.total_users) * 100) : 0;
              return (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-300">{prof.name}</span>
                    <span className="text-slate-800 dark:text-white">{prof.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-400 dark:bg-slate-500 transition-all duration-700"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 dark:border-white/5 pt-5 mt-2">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <Building2 size={14} className="text-slate-400" /> Mulk turlari
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {stats.property_type_stats.map((pt, idx) => (
                <div key={idx} className="flex flex-col gap-0.5 bg-slate-50 dark:bg-white/5 px-3 py-2 rounded-xl border border-slate-100 dark:border-white/5">
                  <span className="text-lg font-black text-slate-800 dark:text-white">{pt.count}</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{pt.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Server + Online mini row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="bg-white dark:bg-[#10101f] rounded-2xl border border-slate-100 dark:border-white/5 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
            <Activity size={18} className="text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-slate-400 font-semibold">CPU</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '23%' }} />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-white shrink-0">23%</span>
            </div>
          </div>
        </div>
        {/* RAM */}
        <div className="bg-white dark:bg-[#10101f] rounded-2xl border border-slate-100 dark:border-white/5 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-slate-400 font-semibold">RAM</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: '41%' }} />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-white shrink-0">41%</span>
            </div>
          </div>
        </div>
        {/* Online users */}
        <Link href="/admin/online-users"
          className="bg-white dark:bg-[#10101f] rounded-2xl border border-slate-100 dark:border-white/5 p-4 flex items-center gap-3 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 relative">
            <Wifi size={18} className="text-emerald-500" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#10101f] animate-pulse" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-semibold">Online</p>
            <p className="text-xl font-black text-emerald-600">{stats.online_users ?? 12} <span className="text-xs font-semibold text-slate-400">kishi</span></p>
          </div>
        </Link>
        {/* Server */}
        <Link href="/admin/system"
          className="bg-white dark:bg-[#10101f] rounded-2xl border border-slate-100 dark:border-white/5 p-4 flex items-center gap-3 hover:border-sky-300 dark:hover:border-sky-500/40 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-sky-500" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-semibold">Server</p>
            <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Ishlayapti
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Activity & Quick Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-[#10101f] rounded-2xl border border-slate-100 dark:border-white/5 p-6 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="text-slate-400" size={18} /> Oxirgi Faoliyat
          </h2>
          <div className="flex flex-col">
            {stats.recent_activity.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Hozircha faoliyat yo&apos;q</p>
            ) : (
              stats.recent_activity.map((act, idx) => (
                <div key={idx} className="flex items-center gap-4 py-3 border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] px-2 -mx-2 rounded-xl transition-colors">
                  <div className="text-slate-400">
                    {act.icon === 'user' ? <UserPlus size={16} /> : <Building2 size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] text-slate-700 dark:text-slate-300 font-medium truncate block">{act.text}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                    {act.time}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Panel + Quick Links */}
        <div className="flex flex-col gap-4">
          {/* AI tavsiyalar */}
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-500/10 dark:to-indigo-500/10 rounded-2xl border border-violet-200 dark:border-violet-500/20 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
                <Activity size={15} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-violet-700 dark:text-violet-400">AI Tavsiyalar</p>
                <p className="text-[10px] text-violet-500">Real vaqt tahlili</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                {stats.pending_complaints} shikoyat kutmoqda
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                {stats.new_users_today} yangi foydalanuvchi bugun
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                {stats.new_properties_week} e&apos;lon bu hafta
              </div>
            </div>
            <Link href="/admin/ai-assistant"
              className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold text-center transition-all">
              AI Yordamchiga o&apos;tish →
            </Link>
          </div>

          {/* Quick links */}
          <div className="bg-white dark:bg-[#10101f] rounded-2xl border border-slate-100 dark:border-white/5 p-5 flex flex-col gap-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tezkor havolalar</p>
            {[
              { name: 'Foydalanuvchilar', href: '/admin/users',        icon: Users },
              { name: "E'lonlar",         href: '/admin/properties',    icon: Building2 },
              { name: "To'lovlar",        href: '/admin/payments',      icon: CreditCard },
              { name: 'Shikoyatlar',      href: '/admin/complaints',    icon: AlertTriangle },
              { name: 'AI Yordamchi',     href: '/admin/ai-assistant',  icon: Activity },
              { name: 'Sozlamalar',       href: '/admin/settings',      icon: Settings },
            ].map((link, idx) => {
              const Icon = link.icon;
              return (
                <Link key={idx} href={link.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <Icon size={15} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
