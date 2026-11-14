'use client';

import { useState, useEffect } from 'react';
import { useStore, api } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { 
  Settings as SettingsIcon, Globe, Lock, Bell, 
  Palette, Save, ShieldAlert, Key, Check, Calculator
} from 'lucide-react';

// Kalkulyator narxlarining standart qiymatlari (backend bilan bir xil)
type CalculatorSettings = {
  usd_rate: number | string;
  construction: Record<string, number | string>;
  renovation: Record<string, number | string>;
};

const CALC_DEFAULTS: CalculatorSettings = {
  usd_rate: 12850,
  construction: {
    base_m2: 3300000,
    basement_m2: 1150000,
    roof_tile: 140000,
    roof_soft: 90000,
    heating_floor: 180000,
    heating_combined: 250000,
    wall_brick: 1.15,
    wall_aerated: 1.05,
    wall_cinder: 0.95,
    wall_monolit: 1.25,
    finish_rough: 0.65,
    finish_standard: 1.0,
    finish_premium: 1.45,
  },
  renovation: {
    base_cosmetic: 950000,
    base_standard: 1800000,
    base_euro: 2950000,
    plumbing: 240000,
    electric: 200000,
    ceiling_stretch: 120000,
    ceiling_drywall: 210000,
    floor_laminate: 140000,
    floor_tile: 240000,
    floor_parquet: 480000,
    wall_decorative: 180000,
    door_standard: 1300000,
    door_euro: 2200000,
  },
};

const CALC_FIELD_GROUPS: {
  section: 'construction' | 'renovation';
  title: string;
  fields: { key: string; label: string }[];
}[] = [
  {
    section: 'construction',
    title: 'Uy Qurilishi (1 m² / koeffitsientlar)',
    fields: [
      { key: 'base_m2', label: "1 m² asosiy narx (so'm)" },
      { key: 'basement_m2', label: "Yerto'la (1 m² uchun)" },
      { key: 'roof_tile', label: 'Cherepitsa tomi (qo\'shimcha)' },
      { key: 'roof_soft', label: 'Yumshoq tom (qo\'shimcha)' },
      { key: 'heating_floor', label: 'Issiq pol (qo\'shimcha)' },
      { key: 'heating_combined', label: 'Kombinatsiyalangan isitish (qo\'shimcha)' },
      { key: 'wall_brick', label: "G'isht koeffitsienti" },
      { key: 'wall_aerated', label: 'Gazoblok koeffitsienti' },
      { key: 'wall_cinder', label: 'Shlakoblok koeffitsienti' },
      { key: 'wall_monolit', label: 'Monolit koeffitsienti' },
      { key: 'finish_rough', label: 'Korobka koeffitsienti' },
      { key: 'finish_standard', label: 'Standart pardoz koeffitsienti' },
      { key: 'finish_premium', label: 'Premium pardoz koeffitsienti' },
    ],
  },
  {
    section: 'renovation',
    title: "Uyni Ta'mirlash (1 m² narxlari)",
    fields: [
      { key: 'base_cosmetic', label: 'Kosmetik ta\'mir 1 m²' },
      { key: 'base_standard', label: 'Kapital ta\'mir 1 m²' },
      { key: 'base_euro', label: 'Yevro / dizayn 1 m²' },
      { key: 'plumbing', label: 'Santexnika (qo\'shimcha)' },
      { key: 'electric', label: 'Elektr (qo\'shimcha)' },
      { key: 'ceiling_stretch', label: 'Natyajnoy shift' },
      { key: 'ceiling_drywall', label: 'Gipsokarton shift' },
      { key: 'floor_laminate', label: 'Laminat pol' },
      { key: 'floor_tile', label: 'Kafel / granit pol' },
      { key: 'floor_parquet', label: 'Parket pol' },
      { key: 'wall_decorative', label: 'Dekorativ suvoq' },
      { key: 'door_standard', label: 'Oddiy eshik (dona)' },
      { key: 'door_euro', label: 'Yevro eshik (dona)' },
    ],
  },
];

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
    calculator: {
      usd_rate: CALC_DEFAULTS.usd_rate,
      construction: { ...CALC_DEFAULTS.construction },
      renovation: { ...CALC_DEFAULTS.renovation },
    },
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

  const handleCalcChange = (section: 'construction' | 'renovation', key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      calculator: {
        ...prev.calculator,
        [section]: { ...prev.calculator[section], [key]: value },
      },
    }));
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
            <SettingsIcon className="text-slate-500" size={28} /> {isSuperAdmin ? 'Sozlamalar' : 'Kalkulyator Narxlari'}
          </h1>
          <p className="text-slate-500 text-sm">
            {isSuperAdmin ? 'Bosh sahifa, aloqa va kalkulyator narxlari sozlamalari' : 'Kalkulyator hisob-kitoblarida ishlatiladigan narxlar'}
          </p>
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
          {/* General — faqat super admin uchun */}
          {isSuperAdmin && (
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
          )}

          {/* Kalkulyator narxlari */}
          <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-slate-200 dark:border-white/5 p-6 flex flex-col gap-6">
            <div className="border-b border-slate-100 dark:border-white/5 pb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Calculator className="text-blue-500" size={20} /> Kalkulyator Narxlari
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Bu qiymatlar <span className="font-semibold">/calculator</span> sahifasidagi hisob-kitoblarda ishlatiladi.
              </p>
            </div>

            <div className="flex flex-col gap-1.5 sm:max-w-xs">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-400">1 USD kursi (so&apos;m)</label>
              <input
                type="number"
                step="any"
                value={settings.calculator.usd_rate}
                onChange={(e) => setSettings(prev => ({ ...prev, calculator: { ...prev.calculator, usd_rate: e.target.value } }))}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080711] text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 outline-none transition-all text-slate-800 dark:text-white"
              />
            </div>

            {CALC_FIELD_GROUPS.map((group) => (
              <div key={group.section} className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">{group.title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {group.fields.map((f) => (
                    <div key={f.key} className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{f.label}</label>
                      <input
                        type="number"
                        step="any"
                        value={settings.calculator[group.section][f.key] ?? ''}
                        onChange={(e) => handleCalcChange(group.section, f.key, e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080711] text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 outline-none transition-all text-slate-800 dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
