'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, useStore } from '@/store/useStore';
import { 
  Building2, Search, Filter, Trash2, Eye, MapPin, 
  Bed, Bath, Expand, CheckCircle2, XCircle, Clock
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
    </div>
  );
}
