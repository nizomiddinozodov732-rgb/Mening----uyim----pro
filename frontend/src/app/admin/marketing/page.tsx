'use client';

import { useState, useEffect } from 'react';
import { api } from '@/store/useStore';
import { Megaphone, Image as ImageIcon, Tag, Plus, Trash2 } from 'lucide-react';

interface Banner { id: number; title: string; position: string; is_active: boolean; clicks: number; views: number; created_at: string; }
interface Promo { id: number; code: string; discount_percent: number; max_uses: number; used_count: number; is_active: boolean; valid_until: string | null; }

export default function MarketingCenter() {
  const [data, setData] = useState<{ banners: Banner[], promos: Promo[] }>({ banners: [], promos: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'banners' | 'promos'>('banners');

  const fetchData = () => {
    setLoading(true);
    api.get('/dashboard/marketing/')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const [bForm, setBForm] = useState({ title: '', link: '', position: 'hero' });
  const [pForm, setPForm] = useState({ code: '', discount_percent: 10, max_uses: 100, valid_until: '' });

  const addBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/dashboard/marketing/', { type: 'banner', ...bForm });
      setBForm({ title: '', link: '', position: 'hero' });
      fetchData();
    } catch (err) { alert('Xato'); }
  };

  const addPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/dashboard/marketing/', { type: 'promo', ...pForm });
      setPForm({ code: '', discount_percent: 10, max_uses: 100, valid_until: '' });
      fetchData();
    } catch (err) { alert('Xato'); }
  };

  const deleteItem = async (type: string, id: number) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete('/dashboard/marketing/', { data: { type, id } });
      fetchData();
    } catch (err) { alert('Xato'); }
  };

  if (loading && data.banners.length === 0) return <div className="animate-pulse h-96 bg-slate-200 dark:bg-white/5 rounded-2xl"></div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <Megaphone className="text-rose-500" /> Marketing Markazi
        </h1>
        <p className="text-sm text-slate-500 mt-1">Bannerlar va aksiya kodlarini boshqarish</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setActiveTab('banners')} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'banners' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25' : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300'}`}>
          <ImageIcon size={16} /> Bannerlar
        </button>
        <button onClick={() => setActiveTab('promos')} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'promos' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25' : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300'}`}>
          <Tag size={16} /> Aksiya Kodlari
        </button>
      </div>

      {activeTab === 'banners' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 glass p-6 rounded-2xl flex flex-col gap-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Plus size={18} /> Yangi Banner</h2>
            <form onSubmit={addBanner} className="flex flex-col gap-3">
              <input type="text" placeholder="Sarlavha" value={bForm.title} onChange={e => setBForm({...bForm, title: e.target.value})} required className="glass-input rounded-xl px-4 py-2 text-sm" />
              <input type="url" placeholder="Havola (Link)" value={bForm.link} onChange={e => setBForm({...bForm, link: e.target.value})} className="glass-input rounded-xl px-4 py-2 text-sm" />
              <select value={bForm.position} onChange={e => setBForm({...bForm, position: e.target.value})} className="glass-input rounded-xl px-4 py-2 text-sm">
                <option value="hero">Bosh sahifa (Hero)</option>
                <option value="sidebar">Yon panel</option>
                <option value="footer">Pastki qism</option>
                <option value="popup">Popup</option>
              </select>
              <button type="submit" className="bg-rose-500 text-white font-bold py-2 rounded-xl mt-2 hover:bg-rose-600 transition-colors">Qo'shish</button>
            </form>
          </div>
          <div className="lg:col-span-2 glass rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr className="text-slate-500 border-b border-slate-200 dark:border-white/5">
                  <th className="p-4 font-semibold">Sarlavha</th>
                  <th className="p-4 font-semibold">Joylashuv</th>
                  <th className="p-4 font-semibold">Statistika</th>
                  <th className="p-4 font-semibold text-right">Amal</th>
                </tr>
              </thead>
              <tbody>
                {data.banners.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-slate-500">Bannerlar yo'q</td></tr> : data.banners.map(b => (
                  <tr key={b.id} className="border-b border-slate-100 dark:border-white/5">
                    <td className="p-4 font-bold">{b.title}</td>
                    <td className="p-4 text-slate-500">{b.position}</td>
                    <td className="p-4 text-xs font-mono">{b.views} ko'rish / {b.clicks} klik</td>
                    <td className="p-4 text-right">
                      <button onClick={() => deleteItem('banner', b.id)} className="text-rose-500 hover:text-rose-700 p-1 bg-rose-50 dark:bg-rose-500/10 rounded"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'promos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 glass p-6 rounded-2xl flex flex-col gap-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Plus size={18} /> Yangi Aksiya Kodi</h2>
            <form onSubmit={addPromo} className="flex flex-col gap-3">
              <input type="text" placeholder="Kod (masalan: NEWYEAR)" value={pForm.code} onChange={e => setPForm({...pForm, code: e.target.value.toUpperCase()})} required className="glass-input rounded-xl px-4 py-2 text-sm uppercase" />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500">Chegirma %</label>
                  <input type="number" value={pForm.discount_percent} onChange={e => setPForm({...pForm, discount_percent: parseInt(e.target.value)})} min="1" max="100" required className="w-full glass-input rounded-xl px-4 py-2 text-sm" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-slate-500">Limit</label>
                  <input type="number" value={pForm.max_uses} onChange={e => setPForm({...pForm, max_uses: parseInt(e.target.value)})} required className="w-full glass-input rounded-xl px-4 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Amal qilish muddati</label>
                <input type="date" value={pForm.valid_until} onChange={e => setPForm({...pForm, valid_until: e.target.value})} className="w-full glass-input rounded-xl px-4 py-2 text-sm" />
              </div>
              <button type="submit" className="bg-rose-500 text-white font-bold py-2 rounded-xl mt-2 hover:bg-rose-600 transition-colors">Qo'shish</button>
            </form>
          </div>
          <div className="lg:col-span-2 glass rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr className="text-slate-500 border-b border-slate-200 dark:border-white/5">
                  <th className="p-4 font-semibold">Kod</th>
                  <th className="p-4 font-semibold">Chegirma</th>
                  <th className="p-4 font-semibold">Foydalanildi</th>
                  <th className="p-4 font-semibold">Muddat</th>
                  <th className="p-4 font-semibold text-right">Amal</th>
                </tr>
              </thead>
              <tbody>
                {data.promos.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-500">Aksiya kodlari yo'q</td></tr> : data.promos.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 dark:border-white/5">
                    <td className="p-4 font-bold font-mono text-rose-500">{p.code}</td>
                    <td className="p-4 font-bold">{p.discount_percent}%</td>
                    <td className="p-4 text-xs font-mono">{p.used_count} / {p.max_uses}</td>
                    <td className="p-4 text-xs text-slate-500">{p.valid_until || 'Cheksiz'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => deleteItem('promo', p.id)} className="text-rose-500 hover:text-rose-700 p-1 bg-rose-50 dark:bg-rose-500/10 rounded"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
