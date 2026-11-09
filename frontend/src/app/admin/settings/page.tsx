'use client';

import { useState, useEffect } from 'react';
import { useStore, api } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { 
  Settings as SettingsIcon, Globe, Lock, Bell, 
  Palette, Save, ShieldAlert, Key, Check
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { user: currentUser } = useStore();
  const router = useRouter();
  const isSuperAdmin = Boolean(currentUser?.is_super_admin || (currentUser as any)?.is_superuser);
  const isAdmin = Boolean(currentUser?.is_admin || isSuperAdmin || (currentUser as any)?.is_staff);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  const [settings, setSettings] = useState({
    hero_title: "Orzuingizdagi uyni bugun toping",
    hero_subtitle: "Ko'chmas mulk, qurilish materiallari, ustalar va arxitektorlar — hammasi bir joyda.",
    hero_badge: "O'zbekistoning №1 ko'chmas mulk platformasi",
    announcement_text: "",
    contact_email: 'info@houseshop.uz',
    contact_phone: '+998 90 123 45 67',
    telegram_url: 'https://t.me/houseshop_uz',
    instagram_url: 'https://instagram.com/houseshop_uz',
  });

  useEffect(() => {
    if (currentUser && !isAdmin) {
      router.push('/');
      return;
    }

    api.get('/dashboard/settings/')
      .then((res) => {
        if (res.data) {
          setSettings((prev) => ({
            ...prev,
            ...res.data,
          }));
        }
      })
      .catch((err) => console.error('Error fetching settings:', err))
      .finally(() => setFetching(false));
  }, [currentUser, isAdmin, router]);

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccessMsg('');
    try {
      await api.put('/dashboard/settings/', settings);
      setSuccessMsg("Sozlamalar muvaffaqiyatli saqlandi!");
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.response?.data?.error || "Sozlamalarni saqlashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="text-slate-500" size={28} /> Sozlamalar
          </h1>
          <p className="text-slate-500 text-sm">Bosh sahifa va tizimning umumiy sozlamalari</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 disabled:opacity-70"
        >
          <Save size={18} /> {loading ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2 border border-emerald-200 dark:border-emerald-500/20">
          <Check size={18} /> {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Main Settings */}
        <div className="md:col-span-12 flex flex-col gap-6">
          {/* General */}
          <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-slate-200 dark:border-white/5 p-6 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-4">
              <Globe className="text-blue-500" size={20} /> Bosh Sahifa va Aloqa Sozlamalari
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Yuqori nishon (Hero Badge)</label>
                <input 
                  type="text" 
                  value={settings.hero_badge || ''}
                  onChange={(e) => handleChange('hero_badge', e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080711] text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 outline-none transition-all text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Asosiy Sarlavha (Hero Title)</label>
                <textarea 
                  rows={2}
                  value={settings.hero_title || ''}
                  onChange={(e) => handleChange('hero_title', e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080711] text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 outline-none transition-all text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Kichik Sarlavha / Ta&apos;rif (Hero Subtitle)</label>
                <textarea 
                  rows={3}
                  value={settings.hero_subtitle || ''}
                  onChange={(e) => handleChange('hero_subtitle', e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080711] text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 outline-none transition-all text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">E&apos;lon / Aksiya matni (Announcement Banner)</label>
                <input 
                  type="text" 
                  value={settings.announcement_text || ''}
                  onChange={(e) => handleChange('announcement_text', e.target.value)}
                  placeholder="Masalan: Bahorgi chegirmalar boshlandi!"
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080711] text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 outline-none transition-all text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Aloqa Email</label>
                <input 
                  type="email" 
                  value={settings.contact_email || ''}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080711] text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 outline-none transition-all text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Aloqa Telefon</label>
                <input 
                  type="text" 
                  value={settings.contact_phone || ''}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080711] text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 outline-none transition-all text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Rasmiy Telegram</label>
                <input 
                  type="text" 
                  value={settings.telegram_url || ''}
                  onChange={(e) => handleChange('telegram_url', e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080711] text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 outline-none transition-all text-slate-800 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Rasmiy Instagram</label>
                <input 
                  type="text" 
                  value={settings.instagram_url || ''}
                  onChange={(e) => handleChange('instagram_url', e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080711] text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 outline-none transition-all text-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
