'use client';

import { useState, useEffect } from 'react';
import { api } from '@/store/useStore';
import { Map, Home, PenTool, Package } from 'lucide-react';

interface RegionStat {
  name: string;
  code: string;
  houses_sold: number;
  active_listings: number;
  avg_price: number;
  workers_count: number;
  materials_count: number;
}

export default function StatisticsMap() {
  const [stats, setStats] = useState<RegionStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/region-stats/')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse h-96 bg-slate-200 dark:bg-white/5 rounded-2xl"></div>;
  }

  // Calculate max values for bar scaling
  const maxListings = Math.max(...stats.map(s => s.active_listings), 1);
  const maxPrice = Math.max(...stats.map(s => s.avg_price), 1);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <Map className="text-emerald-500" /> O'zbekiston Statistikasi
        </h1>
        <p className="text-sm text-slate-500 mt-1">Viloyatlar bo'yicha ko'chmas mulk, ustalar va materiallar bozori</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Listings vs Sold */}
        <div className="glass p-6 rounded-2xl flex flex-col gap-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><Home className="text-blue-500" size={20}/> E'lonlar va Savdolar</h2>
          <div className="flex flex-col gap-3">
            {stats.sort((a,b) => b.active_listings - a.active_listings).map(r => (
              <div key={r.code}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>{r.name}</span>
                  <span className="text-slate-500">{r.active_listings} ta faol / {r.houses_sold} ta sotilgan</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="bg-blue-500 h-full transition-all" style={{ width: `${(r.active_listings / maxListings) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Average Prices */}
        <div className="glass p-6 rounded-2xl flex flex-col gap-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-500">O'rtacha Narxlar (UZS)</h2>
          <div className="flex flex-col gap-3">
            {stats.sort((a,b) => b.avg_price - a.avg_price).map(r => (
              <div key={r.code}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>{r.name}</span>
                  <span className="text-emerald-600 font-mono">{r.avg_price.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(r.avg_price / maxPrice) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workers & Materials Table */}
      <div className="glass rounded-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-white/5">
          <h2 className="text-lg font-bold flex items-center gap-2"><PenTool className="text-amber-500" size={20}/> Ustalar va Materiallar</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-white/5">
              <tr className="text-slate-500 border-b border-slate-200 dark:border-white/5">
                <th className="p-4 font-semibold">Viloyat</th>
                <th className="p-4 font-semibold text-center">Faol Ustalar</th>
                <th className="p-4 font-semibold text-center">Material Do'konlar/Mahsulotlar</th>
              </tr>
            </thead>
            <tbody>
              {stats.sort((a,b) => a.name.localeCompare(b.name)).map(r => (
                <tr key={r.code} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="p-4 font-bold">{r.name}</td>
                  <td className="p-4 text-center">
                    <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-3 py-1 rounded-lg font-bold">
                      {r.workers_count} kishi
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 px-3 py-1 rounded-lg font-bold">
                      {r.materials_count} xil
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
