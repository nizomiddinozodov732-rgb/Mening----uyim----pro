'use client';

import { useState, useEffect } from 'react';
import { api } from '@/store/useStore';
import { Briefcase, Trophy, Star, Hammer, Package, DollarSign } from 'lucide-react';

interface BizStats {
  top_sellers: any[];
  top_workers: any[];
  top_architects: any[];
  top_materials: any[];
}

export default function BusinessAnalytics() {
  const [stats, setStats] = useState<BizStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/business-analytics/')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <div className="animate-pulse h-96 bg-slate-200 dark:bg-white/5 rounded-2xl"></div>;
  }

  const renderTopList = (title: string, icon: any, color: string, items: any[], type: 'seller' | 'worker' | 'architect' | 'material') => (
    <div className="glass p-6 rounded-2xl flex flex-col gap-4">
      <h2 className={`text-lg font-bold flex items-center gap-2 ${color}`}>
        {icon} {title}
      </h2>
      <div className="flex flex-col gap-3">
        {items.length === 0 ? <p className="text-sm text-slate-500">Ma'lumot yo'q</p> : items.map((item, i) => (
          <div key={i} className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center group hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                i === 0 ? 'bg-amber-100 text-amber-600 border border-amber-300' :
                i === 1 ? 'bg-slate-200 text-slate-600 border border-slate-400' :
                i === 2 ? 'bg-orange-100 text-orange-600 border border-orange-300' :
                'bg-slate-100 text-slate-500'
              }`}>
                #{i + 1}
              </div>
              <div>
                <div className="font-bold text-sm flex items-center gap-2">
                  {item.name} 
                  {item.verified && <span className="bg-blue-500 w-1.5 h-1.5 rounded-full inline-block"></span>}
                </div>
                <div className="text-xs text-slate-500">
                  {type === 'seller' && `${item.sales} ta savdo`}
                  {type === 'worker' && item.profession}
                  {type === 'material' && item.store}
                </div>
              </div>
            </div>
            <div className="text-right">
              {type === 'seller' && <div className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">{item.revenue.toLocaleString()} UZS</div>}
              {(type === 'worker' || type === 'architect') && (
                <div className="flex items-center gap-1 text-amber-500 text-sm font-bold bg-amber-50 px-2 py-1 rounded-md">
                  <Star size={14} className="fill-amber-500" /> {item.rating.toFixed(1)} <span className="text-xs font-normal text-slate-400">({item.rating_count})</span>
                </div>
              )}
              {type === 'material' && (
                <>
                  <div className="text-xs font-bold text-blue-600">{item.price} UZS</div>
                  <div className="text-[10px] text-slate-400">Qoldiq: {item.quantity} ta</div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <Briefcase className="text-blue-500" /> Biznes Analitika
        </h1>
        <p className="text-sm text-slate-500 mt-1">Platformaning TOP reytinglari va ko'rsatkichlari</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderTopList("Eng Ko'p Daromad Qilgan Sotuvchilar", <DollarSign size={20} />, "text-emerald-500", stats.top_sellers, 'seller')}
        {renderTopList("Eng Yuqori Reytingli Ustalar", <Hammer size={20} />, "text-amber-500", stats.top_workers, 'worker')}
        {renderTopList("Eng Mashhur Arxitektorlar", <Trophy size={20} />, "text-indigo-500", stats.top_architects, 'architect')}
        {renderTopList("Eng Ko'p Sotiladigan Materiallar", <Package size={20} />, "text-sky-500", stats.top_materials, 'material')}
      </div>
    </div>
  );
}
