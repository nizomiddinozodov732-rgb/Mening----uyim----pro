'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, useStore } from '@/store/useStore';
import { 
  Users, Search, ShieldAlert, CheckCircle2, XCircle, 
  UserPlus, Trash2, Shield, BadgeCheck, Phone, Mail,
  Star, Building2, CreditCard, Eye, EyeOff, X, ChevronDown,
  Filter, Edit3, Key, Plus
} from 'lucide-react';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  phone: string;
  full_name: string;
  first_name: string;
  last_name: string;
  profession: string;
  profession_code: string;
  avatar: string | null;
  bio: string;
  rating: number;
  rating_count: number;
  is_active: boolean;
  is_staff: boolean;
  is_admin: boolean;
  is_super_admin: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  is_online: boolean;
  date_joined: string;
  last_seen: string;
  properties_count: number;
  payments_count: number;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [professionFilter, setProfessionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    profession: 'customer',
    is_active: true,
    is_verified: false,
    is_admin: false,
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    user_id: 0,
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    profession: 'customer',
    is_active: true,
    is_verified: false,
    is_admin: false,
  });

  const openEditModal = (u: AdminUser) => {
    setEditingUser(u);
    setEditForm({
      user_id: u.id,
      username: u.username,
      email: u.email,
      password: '',
      first_name: u.first_name,
      last_name: u.last_name,
      phone: u.phone || '',
      profession: u.profession_code || 'customer',
      is_active: u.is_active,
      is_verified: u.is_verified,
      is_admin: u.is_admin,
    });
    setFormError('');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/dashboard/users/', createForm);
      setIsCreateOpen(false);
      setCreateForm({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        profession: 'customer',
        is_active: true,
        is_verified: false,
        is_admin: false,
      });
      fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Foydalanuvchi yaratishda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.put('/dashboard/users/', editForm);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Foydalanuvchi ma'lumotlarini saqlashda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const isSuperAdmin = currentUser?.is_super_admin || false;

  const fetchUsers = useCallback(async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (professionFilter) params.profession = professionFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/dashboard/users/', { params });
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [search, professionFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Auto refresh every 60s, only when tab visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchUsers();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchUsers]);

  const handleAction = async (userId: number, action: string) => {
    if (action === 'delete' && !confirm("Bu foydalanuvchini o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi!")) return;
    setActionLoading(userId);
    try {
      await api.patch('/dashboard/users/', { user_id: userId, action });
      fetchUsers();
      if (selectedUser?.id === userId) setSelectedUser(null);
    } catch (err: any) {
      alert(err.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setActionLoading(null);
    }
  };

  const professions = [
    { code: '', label: 'Barchasi' },
    { code: 'customer', label: 'Mijoz' },
    { code: 'seller', label: 'Sotuvchi' },
    { code: 'builder', label: 'Quruvchi' },
    { code: 'repairman', label: "Ta'mirlovchi" },
    { code: 'architect', label: "Me'mor" },
  ];

  const statuses = [
    { code: '', label: 'Barchasi' },
    { code: 'active', label: 'Faol' },
    { code: 'banned', label: 'Ban' },
    { code: 'admin', label: 'Adminlar' },
    { code: 'verified', label: 'Tasdiqlangan' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-blue-600" size={28} /> Foydalanuvchilar
          </h1>
          <p className="text-slate-500 text-sm">Jami {users.length} ta foydalanuvchi</p>
        </div>
        <button
          onClick={() => {
            setFormError('');
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:shadow-none"
        >
          <Plus size={18} /> Yangi foydalanuvchi
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Ism, email, telefon bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 outline-none transition-all text-slate-700 dark:text-slate-200"
          />
        </div>
        <select 
          value={professionFilter} 
          onChange={(e) => setProfessionFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-600 dark:text-slate-300 outline-none"
        >
          {professions.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
        </select>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-600 dark:text-slate-300 outline-none"
        >
          {statuses.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#10101f] border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-white/5">
              <tr>
                <th className="px-5 py-3">Foydalanuvchi</th>
                <th className="px-5 py-3">Kontakt</th>
                <th className="px-5 py-3">Rol</th>
                <th className="px-5 py-3">Holati</th>
                <th className="px-5 py-3">Statistika</th>
                <th className="px-5 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">Yuklanmoqda...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">Foydalanuvchi topilmadi.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-4">
                      <button onClick={() => setSelectedUser(u)} className="flex items-center gap-3 text-left">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 text-white flex items-center justify-center font-bold text-sm">
                            {u.full_name[0] || 'U'}
                          </div>
                          {u.is_online && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0c0c1d]"></div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-white text-sm">{u.full_name}</span>
                          <span className="text-xs text-slate-400">@{u.username}</span>
                        </div>
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Mail size={11} /> {u.email}</span>
                        {u.phone && <span className="flex items-center gap-1"><Phone size={11} /> {u.phone}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-slate-800 dark:text-slate-300 text-xs font-semibold">
                          {u.profession}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {u.is_super_admin && (
                            <span className="flex items-center gap-1 text-[9px] bg-rose-50 dark:bg-rose-500/10 text-rose-600 font-bold px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-500/20 uppercase">
                              <ShieldAlert size={8} /> Super Admin
                            </span>
                          )}
                          {u.is_admin && !u.is_super_admin && (
                            <span className="flex items-center gap-1 text-[9px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 font-bold px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-500/20 uppercase">
                              <Shield size={8} /> Admin
                            </span>
                          )}
                          {u.is_verified && (
                            <span className="flex items-center gap-1 text-[9px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 font-bold px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-500/20">
                              <BadgeCheck size={8} /> Tasdiqlangan
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {u.is_active ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                          <CheckCircle2 size={14} /> Faol
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-500 font-bold text-xs">
                          <XCircle size={14} /> Ban
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Star size={11} className="text-amber-500" /> {u.rating.toFixed(1)} ({u.rating_count})</span>
                        <span className="flex items-center gap-1"><Building2 size={11} /> {u.properties_count} e&apos;lon</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(u)}
                          title="Tahrirlash"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 text-xs font-bold transition-all"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button 
                          onClick={() => handleAction(u.id, 'toggle_active')}
                          disabled={actionLoading === u.id}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            u.is_active 
                              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 hover:bg-rose-100' 
                              : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {u.is_active ? 'Ban' : 'Faol'}
                        </button>
                        <button 
                          onClick={() => handleAction(u.id, 'toggle_verified')}
                          disabled={actionLoading === u.id}
                          title={u.is_verified ? "Tasdiqni bekor qilish" : "Tasdiqlash"}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 hover:bg-blue-100 text-xs font-bold transition-all"
                        >
                          {u.is_verified ? <EyeOff size={12} /> : <BadgeCheck size={12} />}
                        </button>
                        {isSuperAdmin && (
                          <>
                            <button 
                              onClick={() => handleAction(u.id, 'toggle_admin')}
                              disabled={actionLoading === u.id}
                              title={u.is_admin ? "Adminlikdan olish" : "Admin qilish"}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 hover:bg-amber-100 text-xs font-bold transition-all"
                            >
                              {u.is_admin ? <Shield size={12} /> : <ShieldAlert size={12} />}
                            </button>
                            <button 
                              onClick={() => handleAction(u.id, 'delete')}
                              disabled={actionLoading === u.id}
                              title="O'chirish"
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 text-xs font-bold transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white dark:bg-[#12122a] rounded-2xl border border-slate-200 dark:border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 text-white flex items-center justify-center font-bold text-xl">
                  {selectedUser.full_name[0] || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">{selectedUser.full_name}</h3>
                  <p className="text-sm text-slate-500">@{selectedUser.username}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Email', value: selectedUser.email },
                  { label: 'Telefon', value: selectedUser.phone || '—' },
                  { label: 'Kasb', value: selectedUser.profession },
                  { label: 'Reyting', value: `${selectedUser.rating.toFixed(1)} (${selectedUser.rating_count} baho)` },
                  { label: "E'lonlar", value: `${selectedUser.properties_count} ta` },
                  { label: "To'lovlar", value: `${selectedUser.payments_count} ta` },
                  { label: "Ro'yxatdan o'tgan", value: selectedUser.date_joined },
                  { label: 'Oxirgi faollik', value: selectedUser.last_seen || '—' },
                ].map((field, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-white/5 px-3 py-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">{field.label}</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{field.value}</span>
                  </div>
                ))}
              </div>
              {selectedUser.bio && (
                <div className="bg-slate-50 dark:bg-white/5 px-4 py-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Bio</span>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{selectedUser.bio}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                <button 
                  onClick={() => {
                    const u = selectedUser;
                    setSelectedUser(null);
                    openEditModal(u);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-1.5"
                >
                  <Edit3 size={14} /> Tahrirlash
                </button>
                <button 
                  onClick={() => handleAction(selectedUser.id, 'toggle_active')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    selectedUser.is_active 
                      ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600' 
                      : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                  }`}
                >
                  {selectedUser.is_active ? 'Ban qilish' : 'Bandan yechish'}
                </button>
                <button 
                  onClick={() => handleAction(selectedUser.id, 'toggle_verified')}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 transition-all"
                >
                  {selectedUser.is_verified ? 'Tasdiqni olish' : 'Tasdiqlash'}
                </button>
                {isSuperAdmin && (
                  <>
                    <button 
                      onClick={() => handleAction(selectedUser.id, 'toggle_admin')}
                      className="px-4 py-2 rounded-xl text-sm font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 transition-all"
                    >
                      {selectedUser.is_admin ? 'Admin olish' : 'Admin qilish'}
                    </button>
                    <button 
                      onClick={() => handleAction(selectedUser.id, 'delete')}
                      className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 dark:bg-white/5 text-rose-500 transition-all"
                    >
                      O&apos;chirish
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={() => setIsCreateOpen(false)}>
          <div className="bg-white dark:bg-[#12122a] rounded-2xl border border-slate-200 dark:border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/5 mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <UserPlus className="text-blue-600" size={20} /> Yangi foydalanuvchi yaratish
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Foydalanuvchi nomi (username) *</label>
                  <input
                    type="text"
                    required
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                    placeholder="masalan: usta_ali"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Parol *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                    placeholder="Kamida 6 ta belgi"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Ism</label>
                  <input
                    type="text"
                    value={createForm.first_name}
                    onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                    placeholder="Ali"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Familiya</label>
                  <input
                    type="text"
                    value={createForm.last_name}
                    onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                    placeholder="Valiyev"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                    placeholder="ali@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                    placeholder="+998901234567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Kasb / Rol</label>
                <select
                  value={createForm.profession}
                  onChange={(e) => setCreateForm({ ...createForm, profession: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                >
                  <option value="customer">Oddiy mijoz</option>
                  <option value="seller">Sotuvchi</option>
                  <option value="builder">Quruvchi</option>
                  <option value="repairman">Ta&apos;mirlovchi usta</option>
                  <option value="architect">Me&apos;mor (Arxitektor)</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={createForm.is_active}
                    onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Faol hisob
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={createForm.is_verified}
                    onChange={(e) => setCreateForm({ ...createForm, is_verified: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Tasdiqlangan
                </label>
                {isSuperAdmin && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={createForm.is_admin}
                      onChange={(e) => setCreateForm({ ...createForm, is_admin: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Admin huquqi
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 transition-all"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {submitting ? "Saqlanmoqda..." : "Yaratish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={() => setEditingUser(null)}>
          <div className="bg-white dark:bg-[#12122a] rounded-2xl border border-slate-200 dark:border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/5 mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Edit3 className="text-blue-600" size={20} /> Foydalanuvchini tahrirlash: @{editingUser.username}
              </h3>
              <button onClick={() => setEditingUser(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Yangi parol (ixtiyoriy)</label>
                  <input
                    type="password"
                    minLength={6}
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                    placeholder="O'zgartirmaslik uchun bo'sh qoldiring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Ism</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Familiya</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Kasb / Rol</label>
                <select
                  value={editForm.profession}
                  onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                >
                  <option value="customer">Oddiy mijoz</option>
                  <option value="seller">Sotuvchi</option>
                  <option value="builder">Quruvchi</option>
                  <option value="repairman">Ta&apos;mirlovchi usta</option>
                  <option value="architect">Me&apos;mor (Arxitektor)</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Faol hisob
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={editForm.is_verified}
                    onChange={(e) => setEditForm({ ...editForm, is_verified: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Tasdiqlangan
                </label>
                {isSuperAdmin && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={editForm.is_admin}
                      onChange={(e) => setEditForm({ ...editForm, is_admin: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Admin huquqi
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 transition-all"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {submitting ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
