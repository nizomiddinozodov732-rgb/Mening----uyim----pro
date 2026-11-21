'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, useStore } from '@/store/useStore';
import {
  User as UserIcon, Phone, Mail, Edit3, Save, X,
  Settings, Building2, Star, ShieldCheck, Heart,
  Camera, Lock, Eye, EyeOff, CheckCircle2, AlertCircle,
  Briefcase, MapPin, FileText, Pencil, Trash2,
} from 'lucide-react';
import Link from 'next/link';
import WishlistButton from '@/components/WishlistButton';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { useStore as useWishlist } from '@/store/useStore';

type Tab = 'overview' | 'edit' | 'properties' | 'wishlist' | 'password';

export default function Profile() {
  const router = useRouter();
  const { user, isLoggedIn, setUser } = useStore();
  const { wishlist } = useWishlist();
  const [tab, setTab] = useState<Tab>('overview');
  const avatarRef = useRef<HTMLInputElement>(null);

  /* ── Edit form ────────────────────────────────────────── */
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', bio: '', profession: '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saveOk,    setSaveOk]    = useState(false);
  const [saveErr,   setSaveErr]   = useState('');

  /* ── Password form ────────────────────────────────────── */
  const [oldPass,  setOldPass]  = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [showOld,  setShowOld]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [passOk,   setPassOk]   = useState(false);
  const [passErr,  setPassErr]   = useState('');
  const [passLoad, setPassLoad] = useState(false);

  /* ── Properties ───────────────────────────────────────── */
  const [myProps, setMyProps] = useState<any[]>([]);
  const [loadProps, setLoadProps] = useState(false);
  const [propToDelete, setPropToDelete] = useState<any | null>(null);
  const [deletingProp, setDeletingProp] = useState(false);
  const [propDeleteErr, setPropDeleteErr] = useState('');
  const [propDeleteOk, setPropDeleteOk] = useState('');

  useEffect(() => {
    if (!isLoggedIn) { router.push('/login'); return; }
    if (user) {
      setForm({
        first_name: user.first_name,
        last_name:  user.last_name,
        phone:      user.phone,
        bio:        user.bio || '',
        profession: user.profession,
      });
    }
  }, [isLoggedIn, user, router]);

  useEffect(() => {
    if (tab === 'properties' && myProps.length === 0) {
      setLoadProps(true);
      api.get('/properties/my_properties/')
        .then(r => setMyProps(r.data.results || r.data || []))
        .catch(console.error)
        .finally(() => setLoadProps(false));
    }
  }, [tab]);

  if (!user) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  /* ── Avatar tanlab olish ──────────────────────────────── */
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setSaveErr('Avatar 5MB dan kichik bo\'lishi kerak'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  /* ── Profilni saqlash ─────────────────────────────────── */
  const handleSave = async () => {
    setSaving(true); setSaveErr(''); setSaveOk(false);
    try {
      const fd = new FormData();
      fd.append('first_name', form.first_name);
      fd.append('last_name',  form.last_name);
      fd.append('phone',      form.phone);
      fd.append('bio',        form.bio);
      fd.append('profession', form.profession);
      if (avatarFile) fd.append('avatar', avatarFile);

      const res = await api.patch('/auth/profile/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser({ ...user, ...res.data });
      setSaveOk(true);
      setAvatarFile(null);
      setTimeout(() => { setSaveOk(false); setTab('overview'); }, 1500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string,unknown> } };
      const d = e.response?.data;
      setSaveErr(d ? Object.values(d).flat()[0] as string : 'Xatolik yuz berdi');
    } finally { setSaving(false); }
  };

  /* ── Parol o'zgartirish ───────────────────────────────── */
  const handlePassword = async () => {
    setPassErr(''); setPassOk(false);
    if (!oldPass || !newPass || !newPass2) { setPassErr('Barcha maydonlarni to\'ldiring'); return; }
    if (newPass !== newPass2) { setPassErr('Yangi parollar mos emas'); return; }
    if (newPass.length < 8)   { setPassErr('Parol kamida 8 ta belgi bo\'lishi kerak'); return; }
    setPassLoad(true);
    try {
      await api.post('/auth/profile/', { old_password: oldPass, new_password: newPass });
      setPassOk(true);
      setOldPass(''); setNewPass(''); setNewPass2('');
      setTimeout(() => setPassOk(false), 3000);
    } catch {
      setPassErr('Joriy parol noto\'g\'ri yoki xatolik yuz berdi');
    } finally { setPassLoad(false); }
  };

  /* ── E'lonni o'chirish ────────────────────────────────── */
  const handleDeleteProperty = async () => {
    if (!propToDelete) return;
    setDeletingProp(true); setPropDeleteErr('');
    try {
      await api.delete(`/properties/${propToDelete.id}/`);
      setMyProps(prev => prev.filter((x: any) => x.id !== propToDelete.id));
      setPropDeleteOk(`"${propToDelete.title}" e'loni o'chirildi`);
      setPropToDelete(null);
      setTimeout(() => setPropDeleteOk(''), 4000);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } };
      const s = e.response?.status;
      if (s === 403) setPropDeleteErr("Bu e'lonni o'chirish huquqingiz yo'q.");
      else if (s === 404) setPropDeleteErr("E'lon topilmadi. Balki allaqachon o'chirilgan.");
      else if (s === 401) setPropDeleteErr("Sessiya muddati tugagan. Qaytadan tizimga kiring.");
      else setPropDeleteErr("O'chirishda xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setDeletingProp(false);
    }
  };

  const currentAvatar = avatarPreview || user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';

  const NAV: { id: Tab; label: string; icon: typeof UserIcon }[] = [
    { id: 'overview',    label: 'Profil',        icon: UserIcon  },
    { id: 'edit',        label: 'Tahrirlash',     icon: Edit3     },
    { id: 'properties',  label: "E'lonlarim",    icon: Building2 },
    { id: 'wishlist',    label: 'Sevimlilar',     icon: Heart     },
    { id: 'password',    label: 'Parol',          icon: Lock      },
  ];

  return (
    <div className="flex flex-col gap-6 py-6">

      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 relative z-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-[var(--surface)] shadow-xl bg-[var(--bg-2)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={currentAvatar} alt={user.username} className="w-full h-full object-cover" />
            </div>
            <button type="button" onClick={() => avatarRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all">
              <Camera size={14} />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
              <h1 className="text-2xl font-extrabold text-[var(--text)]">{user.first_name} {user.last_name}</h1>
              {user.is_verified && <ShieldCheck size={18} className="text-emerald-500" />}
            </div>
            <p className="text-sm text-[var(--text-3)] mt-0.5">@{user.username}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
              <span className="badge tag-blue">{user.profession_display}</span>
              {user.is_subscribed && <span className="badge tag-amber">⭐ Premium</span>}
            </div>
            {user.bio && <p className="text-sm text-[var(--text-2)] mt-2 line-clamp-2">{user.bio}</p>}
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-black text-amber-500">{user.rating.toFixed(1)}</p>
              <p className="text-xs text-[var(--text-3)]">Reyting</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-blue-600">{user.rating_count}</p>
              <p className="text-xs text-[var(--text-3)]">Baho</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Layout ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Sidebar */}
        <div className="flex flex-col gap-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                tab === id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-[var(--text-2)] hover:bg-[var(--bg-2)]'
              }`}>
              <Icon size={17} /> {label}
              {id === 'wishlist' && wishlist.length > 0 && (
                <span className="ml-auto text-[10px] bg-rose-500 text-white rounded-full px-1.5 py-0.5 font-bold">
                  {wishlist.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:col-span-3">

          {/* ── Overview ──────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="card rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--text)]">Shaxsiy ma&apos;lumotlar</h2>
                <button type="button" onClick={() => setTab('edit')}
                  className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
                  <Edit3 size={14} /> Tahrirlash
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Ism',        value: user.first_name,          icon: UserIcon  },
                  { label: 'Familiya',   value: user.last_name,           icon: UserIcon  },
                  { label: 'Username',   value: `@${user.username}`,      icon: UserIcon  },
                  { label: 'Email',      value: user.email,               icon: Mail      },
                  { label: 'Telefon',    value: user.phone || '—',        icon: Phone     },
                  { label: 'Kasb',       value: user.profession_display,  icon: Briefcase },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="p-4 rounded-xl bg-[var(--bg-2)] border border-[var(--border)]">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={13} className="text-[var(--text-3)]" />
                      <span className="text-xs text-[var(--text-3)] font-semibold uppercase">{label}</span>
                    </div>
                    <span className="font-semibold text-[var(--text)] text-sm">{value}</span>
                  </div>
                ))}
              </div>
              {user.bio && (
                <div className="p-4 rounded-xl bg-[var(--bg-2)] border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={13} className="text-[var(--text-3)]" />
                    <span className="text-xs text-[var(--text-3)] font-semibold uppercase">Bio</span>
                  </div>
                  <p className="text-sm text-[var(--text-2)] leading-relaxed">{user.bio}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Edit ──────────────────────────────────────── */}
          {tab === 'edit' && (
            <div className="card rounded-2xl p-6 flex flex-col gap-5">
              <h2 className="text-lg font-bold text-[var(--text)]">Profilni tahrirlash</h2>

              {saveErr && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 text-sm flex items-center gap-2">
                  <AlertCircle size={14} /> {saveErr}
                </div>
              )}
              {saveOk && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 text-sm flex items-center gap-2">
                  <CheckCircle2 size={14} /> Profil muvaffaqiyatli saqlandi!
                </div>
              )}

              {/* Avatar */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-2)] border border-[var(--border)]">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-[var(--border)] shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={currentAvatar} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[var(--text)]">Profil rasmi</p>
                  <p className="text-xs text-[var(--text-3)] mt-0.5">JPG, PNG • Maksimal 5MB</p>
                </div>
                <button type="button" onClick={() => avatarRef.current?.click()}
                  className="btn btn-outline px-4 py-2 rounded-xl text-sm flex items-center gap-1.5">
                  <Camera size={15} /> O&apos;zgartirish
                </button>
                {avatarPreview && (
                  <button type="button" onClick={() => { setAvatarPreview(null); setAvatarFile(null); }}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--text-2)]">Ism *</label>
                  <input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})}
                    className="glass-input px-4 py-2.5" placeholder="Ismingiz" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--text-2)]">Familiya *</label>
                  <input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})}
                    className="glass-input px-4 py-2.5" placeholder="Familiyangiz" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--text-2)]">Telefon</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="glass-input px-4 py-2.5" placeholder="+998901234567" type="tel" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--text-2)]">Kasb</label>
                  <select value={form.profession} onChange={e => setForm({...form, profession: e.target.value})}
                    className="glass-input px-4 py-2.5">
                    <option value="customer">Oddiy mijoz</option>
                    <option value="seller">Sotuvchi / Rieltor</option>
                    <option value="builder">Quruvchi</option>
                    <option value="repairman">Ta&apos;mirlovchi</option>
                    <option value="architect">Me&apos;mor</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--text-2)]">Bio (o&apos;zingiz haqida)</label>
                <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})}
                  rows={4} className="glass-input px-4 py-2.5 resize-none"
                  placeholder="O'zingiz haqida qisqacha ma'lumot..." />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setTab('overview')}
                  className="btn btn-outline flex-1 py-3 rounded-xl text-sm">
                  Bekor qilish
                </button>
                <button type="button" onClick={handleSave} disabled={saving}
                  className="btn btn-primary flex-1 py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saqlanmoqda...</>
                    : <><Save size={16} /> Saqlash</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* ── Properties ────────────────────────────────── */}
          {tab === 'properties' && (
            <div className="card rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--text)]">Mening e&apos;lonlarim</h2>
                {user.profession !== 'customer' && (
                  <Link href="/properties/add"
                    className="btn btn-primary px-4 py-2 rounded-xl text-sm">
                    + Yangi e&apos;lon
                  </Link>
                )}
              </div>

              {propDeleteOk && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 text-sm flex items-center gap-2">
                  <CheckCircle2 size={14} /> {propDeleteOk}
                </div>
              )}
              {propDeleteErr && !propToDelete && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 text-sm flex items-center gap-2">
                  <AlertCircle size={14} /> {propDeleteErr}
                </div>
              )}

              {loadProps ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1,2].map(n => <div key={n} className="skeleton h-32 rounded-xl" />)}
                </div>
              ) : myProps.length === 0 ? (
                <div className="py-12 text-center text-[var(--text-3)] flex flex-col items-center gap-3">
                  <Building2 size={36} className="opacity-30" />
                  <p className="font-semibold">Hozircha e&apos;lonlar yo&apos;q</p>
                  {user.profession !== 'customer' && (
                    <Link href="/properties/add" className="text-blue-600 text-sm hover:underline">
                      Birinchi e&apos;lonni qo&apos;shing →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myProps.map((p: any) => (
                    <div key={p.id}
                      className="card card-hover rounded-xl overflow-hidden flex flex-col">
                      <Link href={`/properties/${p.id}`} className="flex gap-3 p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.primary_image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200'}
                          alt={p.title} className="w-20 h-16 rounded-lg object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-[var(--text)] line-clamp-1">{p.title}</p>
                          <p className="text-xs text-[var(--text-3)] flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {p.location}
                          </p>
                          <p className="text-sm font-black text-blue-600 mt-1">
                            {parseFloat(p.price).toLocaleString()} UZS
                          </p>
                        </div>
                      </Link>
                      <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                        <Link href={`/properties/${p.id}/edit`}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all">
                          <Pencil size={12} /> Tahrirlash
                        </Link>
                        <button type="button"
                          onClick={() => { setPropDeleteErr(''); setPropToDelete(p); }}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all">
                          <Trash2 size={12} /> O&apos;chirish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Wishlist ───────────────────────────────────── */}
          {tab === 'wishlist' && (
            <div className="card rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--text)]">Sevimlilar</h2>
                <Link href="/wishlist" className="text-sm text-blue-600 hover:underline">
                  To&apos;liq ko&apos;rish →
                </Link>
              </div>
              {wishlist.length === 0 ? (
                <div className="py-12 text-center text-[var(--text-3)] flex flex-col items-center gap-3">
                  <Heart size={36} className="opacity-30" />
                  <p className="font-semibold">Sevimlilar bo&apos;sh</p>
                  <Link href="/properties" className="text-blue-600 text-sm hover:underline">
                    E&apos;lonlarni ko&apos;ring →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlist.slice(0, 6).map(item => (
                    <Link key={`${item.type}-${item.id}`} href={`/properties/${item.id}`}
                      className="card card-hover rounded-xl overflow-hidden flex gap-3 p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200'}
                        alt={item.title} className="w-20 h-16 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[var(--text)] line-clamp-1">{item.title}</p>
                        <p className="text-xs text-[var(--text-3)] mt-0.5 line-clamp-1">{item.location}</p>
                        <p className="text-sm font-black text-blue-600 mt-1">
                          {parseFloat(item.price||'0').toLocaleString()} UZS
                        </p>
                      </div>
                      <WishlistButton item={item} size={14} className="w-7 h-7 shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Password ──────────────────────────────────── */}
          {tab === 'password' && (
            <div className="card rounded-2xl p-6 flex flex-col gap-5">
              <h2 className="text-lg font-bold text-[var(--text)]">Parolni o&apos;zgartirish</h2>

              {passErr && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 text-sm flex items-center gap-2">
                  <AlertCircle size={14} /> {passErr}
                </div>
              )}
              {passOk && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 text-sm flex items-center gap-2">
                  <CheckCircle2 size={14} /> Parol muvaffaqiyatli o&apos;zgartirildi!
                </div>
              )}

              <div className="flex flex-col gap-4 max-w-md">
                {[
                  { label: 'Joriy parol',   val: oldPass, set: setOldPass, show: showOld, toggleShow: () => setShowOld(!showOld) },
                  { label: 'Yangi parol',   val: newPass, set: setNewPass, show: showNew, toggleShow: () => setShowNew(!showNew) },
                  { label: 'Tasdiqlang',    val: newPass2, set: setNewPass2, show: showNew, toggleShow: () => setShowNew(!showNew) },
                ].map(({ label, val, set, show, toggleShow }) => (
                  <div key={label} className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[var(--text-2)]">{label}</label>
                    <div className="relative">
                      <input type={show ? 'text' : 'password'} value={val}
                        onChange={e => { set(e.target.value); setPassErr(''); }}
                        placeholder="••••••••"
                        className="glass-input px-4 py-2.5 pr-10 w-full" />
                      <button type="button" onClick={toggleShow}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text)]">
                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                ))}

                <button type="button" onClick={handlePassword} disabled={passLoad}
                  className="btn btn-primary py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 mt-1">
                  {passLoad
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> O&apos;zgartirilmoqda...</>
                    : <><Lock size={15} /> Parolni o&apos;zgartirish</>
                  }
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── O'chirishni tasdiqlash oynasi ─────────────────── */}
      <ConfirmDeleteModal
        isOpen={!!propToDelete}
        onClose={() => { if (!deletingProp) { setPropToDelete(null); setPropDeleteErr(''); } }}
        onConfirm={handleDeleteProperty}
        title="E'lonni o'chirish"
        message={propToDelete
          ? `"${propToDelete.title}" e'loni butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.`
          : ''}
        loading={deletingProp}
        error={propDeleteErr}
      />
    </div>
  );
}
