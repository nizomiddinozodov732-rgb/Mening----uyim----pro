'use client';

import { useState, useEffect } from 'react';
import { api } from '@/store/useStore';
import { DollarSign, TrendingUp, Calendar, CreditCard } from 'lucide-react';

interface RevenueStats {
  daily: { date: string; amount: number }[];
  weekly: { week: string; amount: number }[];
  monthly: { month: string; amount: number }[];
  totals: { today: number; week: number; month: number; all_time: number };
}

export default function RevenueCenter() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/revenue-center/')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <div className="animate-pulse h-96 bg-slate-200 dark:bg-white/5 rounded-2xl"></div>;
  }

  const renderBarChart = (data: { label: string; value: number }[], colorClass: string, height: string = 'h-48') => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    return (
      <div className={`flex items-end gap-2 ${height} mt-4`}>
        {data.map((item, idx) => {
          const percent = Math.max((item.value / maxVal) * 100, 2); // min 2% height
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-800 text-white px-2 py-1 rounded whitespace-nowrap absolute -mt-8 pointer-events-none z-10">
                {item.value.toLocaleString()} UZS
              </div>
              <div className="w-full flex justify-center h-full items-end">
                <div 
                  className={`w-full max-w-[40px] ${colorClass} rounded-t-sm transition-all duration-500 hover:brightness-110 cursor-pointer`}
                  style={{ height: `${percent}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-500 font-medium rotate-45 md:rotate-0 origin-left mt-2 md:mt-0">{item.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <DollarSign className="text-emerald-500" /> Daromad Markazi
        </h1>
        <p className="text-sm text-slate-500 mt-1">Platformaning moliyaviy ko'rsatkichlari va tahlili</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Bugungi Daromad", value: stats.totals.today, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { title: "Haftalik Daromad", value: stats.totals.week, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
          { title: "Oylik Daromad", value: stats.totals.month, icon: Calendar, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { title: "Jami Daromad", value: stats.totals.all_time, icon: CreditCard, color: 'text-violet-500', bg: 'bg-violet-50' },
        ].map((c, i) => (
          <div key={i} className="glass p-5 rounded-2xl flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.bg} ${c.color} dark:bg-white/5`}>
              <c.icon size={24} />
            </div>
            <div>
              <div className="text-xl font-black">{c.value.toLocaleString()} UZS</div>
              <div className="text-xs font-semibold text-slate-500 uppercase">{c.title}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl flex flex-col">
          <h2 className="text-lg font-bold flex items-center gap-2">Kunlik Daromad (Oxirgi 30 kun)</h2>
          {renderBarChart(stats.daily.map(d => ({ label: d.date, value: d.amount })), 'bg-gradient-to-t from-emerald-600 to-emerald-400')}
        </div>
        
        <div className="glass p-6 rounded-2xl flex flex-col">
          <h2 className="text-lg font-bold flex items-center gap-2">Haftalik Daromad (Oxirgi 12 hafta)</h2>
          {renderBarChart(stats.weekly.map(d => ({ label: d.week, value: d.amount })), 'bg-gradient-to-t from-blue-600 to-blue-400')}
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col lg:col-span-2">
          <h2 className="text-lg font-bold flex items-center gap-2">Oylik Daromad (Yillik trend)</h2>
          {renderBarChart(stats.monthly.map(d => ({ label: d.month, value: d.amount })), 'bg-gradient-to-t from-indigo-600 to-violet-400', 'h-64')}
        </div>
      </div>
    </div>
  );
}
