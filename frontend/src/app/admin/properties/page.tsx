'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, useStore } from '@/store/useStore';
import { 
  Building2, Search, Filter, Trash2, Eye, MapPin, 
  Bed, Bath, Expand, CheckCircle2, XCircle, Clock,
  Plus, Edit3, X
} from 'lucide-react';
import Link from 'next/link';

interface AdminProperty {
  id: number;
  title: string;
  property_type: string;
  type_display: string;
  price: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
  features: string[] | string;
  video_url: string;
  status: string;
  status_display: string;
  views_count: number;
  owner_id: number;
  owner_name: string;
  owner_phone: string;
  primary_image: string | null;
  images_count: number;
  created_at: string;
}

export default function AdminPropertiesPage() {
  const { user: currentUser } = useStore();
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const isSuperAdmin = currentUser?.is_super_admin || false;

  const [owners, setOwners] = useState<{ id: number; full_name: string; username: string }[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<AdminProperty | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const emptyForm = {
    title: '',
    property_type: 'house',
    price: '',
    location: '',
    bedrooms: 0,
    bathrooms: 0,
    area: '',
    description: '',
    features: '',
    video_url: '',
    status: 'active',
    owner_id: '',
  };

  const [createForm, setCreateForm] = useState({ ...emptyForm });
  const [editForm, setEditForm] = useState({ ...emptyForm, property_id: 0 });

  const fetchOwners = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/users/');
      setOwners(
        (res.data || []).map((u: any) => ({
          id: u.id,
          full_name: u.full_name,
          username: u.username,
        }))
      );
    } catch (err) {
      console.error('Error fetching owners:', err);
    }
  }, []);

  const openEditModal = (p: AdminProperty) => {
    setEditingProperty(p);
    setEditForm({
      property_id: p.id,
      title: p.title,
      property_type: p.property_type,
      price: String(parseFloat(p.price)),
      location: p.location,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      area: String(p.area),
      description: p.description || '',
      features: Array.isArray(p.features) ? p.features.join(', ') : (p.features || ''),
      video_url: p.video_url || '',
      status: p.status,
      owner_id: String(p.owner_id),
    });
    setFormError('');
    if (owners.length === 0) fetchOwners();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload: any = { ...createForm };
      if (payload.owner_id) payload.owner_id = Number(payload.owner_id);
      else delete payload.owner_id;
      await api.post('/dashboard/properties/', payload);
      setIsCreateOpen(false);
      setCreateForm({ ...emptyForm });
      fetchProperties();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "E'lon yaratishda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload: any = { ...editForm };
      if (payload.owner_id) payload.owner_id = Number(payload.owner_id);
      else delete payload.owner_id;
      await api.put('/dashboard/properties/', payload);
      setEditingProperty(null);
      fetchProperties();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "E'lon ma'lumotlarini saqlashda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchProperties = useCallback(async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      
      const res = await api.get('/dashboard/properties/', { params });
      setProperties(res.data);
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleStatusChange = async (propertyId: number, newStatus: string) => {
    setActionLoading(propertyId);
    try {
      await api.patch('/dashboard/properties/', { property_id: propertyId, action: 'change_status', status: newStatus });
      fetchProperties();
    } catch (err: any) {
      alert(err.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (propertyId: number) => {
    if (!confirm("E'lonni butunlay o'chirishni xohlaysizmi?")) return;
    setActionLoading(propertyId);
    try {
      await api.patch('/dashboard/properties/', { property_id: propertyId, action: 'delete' });
      fetchProperties();
    } catch (err: any) {
      alert(err.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setActionLoading(null);
    }
  };

  const types = [
    { code: '', label: 'Barchasi' },
    { code: 'house', label: 'Uy' },
    { code: 'apartment', label: 'Kvartira' },
    { code: 'land', label: 'Yer' },
    { code: 'rental', label: 'Ijara' },
  ];

  const statuses = [
    { code: '', label: 'Barchasi' },
    { code: 'active', label: 'Faol' },
    { code: 'sold', label: 'Sotilgan' },
    { code: 'inactive', label: 'Nofaol' },
    { code: 'pending', label: 'Kutilmoqda' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="text-emerald-500" size={28} /> Ko&apos;chmas Mulklar
          </h1>
          <p className="text-slate-500 text-sm">Jami {properties.length} ta e&apos;lon tizimda</p>
        </div>
        <button
          onClick={() => {
            setFormError('');
            setIsCreateOpen(true);
            if (owners.length === 0) fetchOwners();
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:shadow-none"
        >
          <Plus size={18} /> Yangi e&apos;lon
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Sarlavha yoki manzil bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-500/20 outline-none transition-all text-slate-700 dark:text-slate-200"
          />
        </div>
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-600 dark:text-slate-300 outline-none"
        >
          {types.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
        </select>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-600 dark:text-slate-300 outline-none"
        >
          {statuses.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
        </select>
      </div>

      {/* Table/Grid List */}
      <div className="bg-white dark:bg-[#10101f] border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-white/5">
              <tr>
                <th className="px-5 py-3 w-1/3">E&apos;lon</th>
                <th className="px-5 py-3">Narxi / Turi</th>
                <th className="px-5 py-3">Egasi</th>
                <th className="px-5 py-3">Holati</th>
                <th className="px-5 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">Yuklanmoqda...</td></tr>
              ) : properties.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">E&apos;lon topilmadi.</td></tr>
              ) : (
                properties.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex gap-4 items-center">
                        <div className="w-14 h-10 rounded-lg bg-slate-100 dark:bg-white/5 overflow-hidden flex-shrink-0 relative">
                          {p.primary_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.primary_image} alt={p.title} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-5 h-5 m-auto mt-2.5 text-slate-300" />
                          )}
                          <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] font-bold px-1 rounded-tl">
                            {p.images_count}
                          </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <Link href={`/properties/${p.id}`} className="font-bold text-slate-800 dark:text-white text-sm truncate hover:text-emerald-500 transition-colors" target="_blank">
                            {p.title}
                          </Link>
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500 truncate">
                            <MapPin size={11} className="flex-shrink-0" />
                            <span className="truncate">{p.location}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                            {p.bedrooms > 0 && <span className="flex items-center gap-0.5"><Bed size={10} /> {p.bedrooms}</span>}
                            {p.bathrooms > 0 && <span className="flex items-center gap-0.5"><Bath size={10} /> {p.bathrooms}</span>}
                            <span className="flex items-center gap-0.5"><Expand size={10} /> {p.area}m²</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5 items-start">
                        <span className="font-bold text-slate-800 dark:text-white text-sm whitespace-nowrap">
                          {parseFloat(p.price).toLocaleString()} UZS
                        </span>
                        <span className="text-slate-500 text-[11px] font-semibold whitespace-nowrap">
                          {p.type_display}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs truncate max-w-[150px]">{p.owner_name}</span>
                        <span className="text-[11px] text-slate-500">{p.owner_phone}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <select 
                          value={p.status}
                          onChange={(e) => handleStatusChange(p.id, e.target.value)}
                          disabled={actionLoading === p.id}
                          className={`text-xs font-bold px-2 py-0.5 rounded outline-none appearance-none cursor-pointer border
                            ${p.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-500/20' : 
                              p.status === 'pending' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-100 dark:border-amber-500/20' : 
                              p.status === 'sold' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-100 dark:border-blue-500/20' : 
                              'bg-rose-50 dark:bg-rose-500/10 text-rose-600 border-rose-100 dark:border-rose-500/20'}`}
                        >
                          <option value="active">Faol</option>
                          <option value="pending">Kutilmoqda</option>
                          <option value="sold">Sotilgan</option>
                          <option value="inactive">Nofaol</option>
                        </select>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 whitespace-nowrap">
                          <Eye size={10} /> {p.views_count} marta
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/properties/${p.id}`} 
                          target="_blank"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                          title="Ko'rish"
                        >
                          <Eye size={16} />
                        </Link>
                        <button 
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit3 size={16} />
                        </button>
                        {isSuperAdmin && (
                          <button 
                            onClick={() => handleDelete(p.id)}
                            disabled={actionLoading === p.id}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 size={16} />
                          </button>
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

      {/* Create Property Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={() => setIsCreateOpen(false)}>
          <div className="bg-white dark:bg-[#12122a] rounded-2xl border border-slate-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/5 mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Plus className="text-emerald-600" size={20} /> Yangi e&apos;lon yaratish
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
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Sarlavha *</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                  placeholder="masalan: 3 xonali yangi kvartira"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Mulk turi *</label>
                  <select
                    value={createForm.property_type}
                    onChange={(e) => setCreateForm({ ...createForm, property_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                  >
                    <option value="house">Uy</option>
                    <option value="apartment">Kvartira</option>
                    <option value="land">Yer</option>
                    <option value="rental">Ijara</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Holat *</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                  >
                    <option value="active">Faol</option>
                    <option value="pending">Kutilmoqda</option>
                    <option value="sold">Sotilgan</option>
                    <option value="inactive">Nofaol</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Narx (UZS) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={createForm.price}
                    onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                    placeholder="500000000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Maydon (m²) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.1"
                    value={createForm.area}
                    onChange={(e) => setCreateForm({ ...createForm, area: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                    placeholder="85"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Manzil *</label>
                <input
                  type="text"
                  required
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                  placeholder="Toshkent, Chilonzor tumani"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Xonalar soni</label>
                  <input
                    type="number"
                    min={0}
                    value={createForm.bedrooms}
                    onChange={(e) => setCreateForm({ ...createForm, bedrooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Hammomlar soni</label>
                  <input
                    type="number"
                    min={0}
                    value={createForm.bathrooms}
                    onChange={(e) => setCreateForm({ ...createForm, bathrooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Tavsif</label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white resize-none"
                  placeholder="E'lon haqida batafsil ma'lumot..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Qulayliklar (vergul bilan)</label>
                  <input
                    type="text"
                    value={createForm.features}
                    onChange={(e) => setCreateForm({ ...createForm, features: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                    placeholder="Garaj, Hovli, Konditsioner"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Video URL</label>
                  <input
                    type="url"
                    value={createForm.video_url}
                    onChange={(e) => setCreateForm({ ...createForm, video_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Egasi</label>
                <select
                  value={createForm.owner_id}
                  onChange={(e) => setCreateForm({ ...createForm, owner_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                >
                  <option value="">O&apos;zim (admin)</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>{o.full_name} (@{o.username})</option>
                  ))}
                </select>
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
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {submitting ? "Saqlanmoqda..." : "Yaratish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {editingProperty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4" onClick={() => setEditingProperty(null)}>
          <div className="bg-white dark:bg-[#12122a] rounded-2xl border border-slate-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/5 mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Edit3 className="text-emerald-600" size={20} /> E&apos;lonni tahrirlash
              </h3>
              <button onClick={() => setEditingProperty(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Sarlavha *</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Mulk turi *</label>
                  <select
                    value={editForm.property_type}
                    onChange={(e) => setEditForm({ ...editForm, property_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                  >
                    <option value="house">Uy</option>
                    <option value="apartment">Kvartira</option>
                    <option value="land">Yer</option>
                    <option value="rental">Ijara</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Holat *</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                  >
                    <option value="active">Faol</option>
                    <option value="pending">Kutilmoqda</option>
                    <option value="sold">Sotilgan</option>
                    <option value="inactive">Nofaol</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Narx (UZS) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Maydon (m²) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.1"
                    value={editForm.area}
                    onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Manzil *</label>
                <input
                  type="text"
                  required
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Xonalar soni</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.bedrooms}
                    onChange={(e) => setEditForm({ ...editForm, bedrooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Hammomlar soni</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.bathrooms}
                    onChange={(e) => setEditForm({ ...editForm, bathrooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Tavsif</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Qulayliklar (vergul bilan)</label>
                  <input
                    type="text"
                    value={editForm.features}
                    onChange={(e) => setEditForm({ ...editForm, features: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Video URL</label>
                  <input
                    type="url"
                    value={editForm.video_url}
                    onChange={(e) => setEditForm({ ...editForm, video_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Egasi</label>
                <select
                  value={editForm.owner_id}
                  onChange={(e) => setEditForm({ ...editForm, owner_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-white"
                >
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>{o.full_name} (@{o.username})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingProperty(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 transition-all"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
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
