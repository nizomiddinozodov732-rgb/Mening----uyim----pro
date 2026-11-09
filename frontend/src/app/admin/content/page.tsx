'use client';

import { useState, useEffect } from 'react';
import { api } from '@/store/useStore';
import { Globe, Save, Newspaper, Plus, Trash2, Edit } from 'lucide-react';

interface Settings {
  hero_title: string;
  hero_subtitle: string;
  contact_email: string;
  contact_phone: string;
}

interface News {
  id: number;
  title: string;
  content: string;
  image: string | null;
  views: number;
  created_at: string;
}

export default function SiteContentAdmin() {
  const [settings, setSettings] = useState<Settings>({ hero_title: '', hero_subtitle: '', contact_email: '', contact_phone: '' });
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  
  const [newsForm, setNewsForm] = useState({ title: '', content: '', image: null as File | null });
  const [showNewsForm, setShowNewsForm] = useState(false);

  const fetchData = async () => {
    try {
      const [setRes, newsRes] = await Promise.all([
        api.get('/dashboard/settings/'),
        api.get('/dashboard/news/')
      ]);
      setSettings(setRes.data);
      setNews(newsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put('/dashboard/settings/', settings);
      alert('Sozlamalar saqlandi!');
    } catch (err) {
      alert('Xatolik yuz berdi');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', newsForm.title);
    formData.append('content', newsForm.content);
    if (newsForm.image) {
      formData.append('image', newsForm.image);
    }
    
    try {
      await api.post('/dashboard/news/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewsForm({ title: '', content: '', image: null });
      setShowNewsForm(false);
      fetchData();
    } catch (err) {
      alert('Xatolik');
    }
  };

  const handleDeleteNews = async (id: number) => {
    if (!confirm('O\'chirishni tasdiqlaysizmi?')) return;
    try {
      await api.delete(`/dashboard/news/?id=${id}`);
      fetchData();
    } catch (err) {
      alert('Xatolik');
    }
  };

  if (loading) return <div className="animate-pulse h-96 bg-slate-200 dark:bg-white/5 rounded-2xl"></div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <Globe className="text-blue-500" /> Sayt Kontenti
        </h1>
        <p className="text-sm text-slate-500 mt-1">Bosh sahifa matnlari va yangiliklarni boshqarish</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <div className="glass p-6 rounded-2xl flex flex-col gap-4 border-t-4 border-blue-500">
          <h2 className="text-lg font-bold flex items-center gap-2"><Globe size={20} className="text-blue-500"/> Bosh sahifa matnlari</h2>
          
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Asosiy Sarlavha (Hero)</label>
              <textarea 
                value={settings.hero_title}
                onChange={e => setSettings({...settings, hero_title: e.target.value})}
                className="w-full glass-input rounded-xl px-4 py-2 font-bold text-lg"
                rows={2}
              ></textarea>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Qo'shimcha matn (Subtitle)</label>
              <textarea 
                value={settings.hero_subtitle}
                onChange={e => setSettings({...settings, hero_subtitle: e.target.value})}
                className="w-full glass-input rounded-xl px-4 py-2 text-sm"
                rows={3}
              ></textarea>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Aloqa Email</label>
                <input 
                  type="email"
                  value={settings.contact_email}
                  onChange={e => setSettings({...settings, contact_email: e.target.value})}
                  className="w-full glass-input rounded-xl px-4 py-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Aloqa Telefon</label>
                <input 
                  type="text"
                  value={settings.contact_phone}
                  onChange={e => setSettings({...settings, contact_phone: e.target.value})}
                  className="w-full glass-input rounded-xl px-4 py-2 text-sm"
                />
              </div>
            </div>
            <button 
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 mt-2"
            >
              <Save size={18} /> {savingSettings ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </div>

        {/* News Section */}
        <div className="glass p-6 rounded-2xl flex flex-col gap-4 border-t-4 border-emerald-500">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2"><Newspaper size={20} className="text-emerald-500"/> Yangiliklar</h2>
            <button 
              onClick={() => setShowNewsForm(!showNewsForm)}
              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1"
            >
              <Plus size={16} /> Qo'shish
            </button>
          </div>

          {showNewsForm && (
            <form onSubmit={handleAddNews} className="flex flex-col gap-3 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
              <input 
                type="text" placeholder="Yangilik sarlavhasi" required
                value={newsForm.title} onChange={e => setNewsForm({...newsForm, title: e.target.value})}
                className="w-full glass-input rounded-xl px-4 py-2 text-sm font-bold"
              />
              <textarea 
                placeholder="To'liq matni..." required rows={4}
                value={newsForm.content} onChange={e => setNewsForm({...newsForm, content: e.target.value})}
                className="w-full glass-input rounded-xl px-4 py-2 text-sm"
              ></textarea>
              <input 
                type="file" accept="image/*"
                onChange={e => setNewsForm({...newsForm, image: e.target.files?.[0] || null})}
                className="text-xs"
              />
              <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-xl transition-colors mt-2">
                Chop etish
              </button>
            </form>
          )}

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px] pr-2">
            {news.length === 0 ? <p className="text-sm text-slate-500 text-center py-8">Yangiliklar yo'q</p> : news.map(n => (
              <div key={n.id} className="bg-white dark:bg-[#0c0c1d] border border-slate-100 dark:border-white/5 p-4 rounded-xl flex gap-4 group">
                {n.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.image} alt={n.title} className="w-20 h-20 object-cover rounded-lg" />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-sm line-clamp-1">{n.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{n.content}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] text-slate-400 font-mono">{n.created_at} | {n.views} ko'rish</span>
                    <button onClick={() => handleDeleteNews(n.id)} className="text-rose-500 p-1 hover:bg-rose-50 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
