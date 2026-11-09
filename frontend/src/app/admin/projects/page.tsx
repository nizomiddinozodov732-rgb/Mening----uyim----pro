'use client';

import { useState, useEffect } from 'react';
import { api } from '@/store/useStore';
import { HardHat, Plus, Edit, Calendar } from 'lucide-react';

interface Project {
  id: number;
  title: string;
  description: string;
  architect: string | null;
  builder: string | null;
  material_seller: string | null;
  workers_count: number;
  budget: string;
  spent: string;
  location: string;
  status: string;
  status_display: string;
  progress: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export default function ConstructionProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', budget: 0, location: '', status: 'planning' });

  const fetchProjects = () => {
    setLoading(true);
    api.get('/dashboard/projects/')
      .then(res => setProjects(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/dashboard/projects/', form);
      setShowForm(false);
      setForm({ title: '', description: '', budget: 0, location: '', status: 'planning' });
      fetchProjects();
    } catch (err) { alert('Xato'); }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'planning': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
      case 'in_progress': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      case 'completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'paused': return 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300';
      case 'cancelled': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <HardHat className="text-amber-600" /> Qurilish Loyihalari
          </h1>
          <p className="text-sm text-slate-500 mt-1">Platformadagi yirik qurilish jarayonlarini nazorat qilish</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
          {showForm ? 'Yopish' : <><Plus size={18} /> Yangi Loyiha</>}
        </button>
      </div>

      {showForm && (
        <div className="glass p-6 rounded-2xl">
          <h2 className="text-lg font-bold mb-4">Loyiha yaratish</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Loyiha nomi" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="glass-input rounded-xl px-4 py-2" />
            <input type="text" placeholder="Manzil" value={form.location} onChange={e => setForm({...form, location: e.target.value})} required className="glass-input rounded-xl px-4 py-2" />
            <input type="number" placeholder="Budjet (UZS)" value={form.budget || ''} onChange={e => setForm({...form, budget: parseInt(e.target.value)})} required className="glass-input rounded-xl px-4 py-2" />
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="glass-input rounded-xl px-4 py-2">
              <option value="planning">Rejada</option>
              <option value="in_progress">Jarayonda</option>
              <option value="paused">To'xtatilgan</option>
            </select>
            <textarea placeholder="Tavsif" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="glass-input rounded-xl px-4 py-2 md:col-span-2" rows={3}></textarea>
            <div className="md:col-span-2">
              <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2 rounded-xl transition-colors">Saqlash</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? <div className="p-8 text-center text-slate-500 xl:col-span-3">Yuklanmoqda...</div> : projects.length === 0 ? <div className="p-8 text-center text-slate-500 xl:col-span-3">Loyihalar yo'q</div> : projects.map(p => (
          <div key={p.id} className="glass p-5 rounded-2xl flex flex-col gap-4 group hover:border-amber-300 dark:hover:border-amber-500/50 transition-colors">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate pr-2">{p.title}</h3>
              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase whitespace-nowrap ${getStatusColor(p.status)}`}>{p.status_display}</span>
            </div>
            
            <p className="text-sm text-slate-500 line-clamp-2">{p.description || "Tavsif yo'q"}</p>
            
            <div className="flex flex-col gap-2 text-xs font-medium">
              <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-1">
                <span className="text-slate-400">Manzil:</span>
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{p.location || 'Noma\'lum'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-1">
                <span className="text-slate-400">Budjet:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{parseFloat(p.budget).toLocaleString()} UZS</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-1">
                <span className="text-slate-400">Arxitektor:</span>
                <span className="text-slate-700 dark:text-slate-300">{p.architect || '—'}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-slate-400">Quruvchi:</span>
                <span className="text-slate-700 dark:text-slate-300">{p.builder || '—'}</span>
              </div>
            </div>

            <div className="mt-auto pt-4 flex flex-col gap-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500">Progress</span>
                <span className="text-amber-600">{p.progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 transition-all" style={{ width: `${p.progress}%` }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
