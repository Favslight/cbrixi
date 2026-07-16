'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CAMPAIGN_PLACEMENTS,
  CAMPAIGN_TYPES,
  activateAdminCampaign,
  createAdminCampaign,
  deactivateAdminCampaign,
  deleteAdminCampaign,
  fetchAdminCampaignStats,
  fetchAdminCampaigns,
  placementLabel,
  updateAdminCampaign,
  type Campaign,
  type CampaignPayload,
  type CampaignPlacement,
  type CampaignStats,
  type CampaignStatusFilter,
  type CampaignType,
} from '@/lib/campaigns';
import CampaignContent from '@/components/campaigns/CampaignContent';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cbrixi.com';

type ProductOption = {
  id: string;
  name: string;
  image_url?: string | null;
  image?: string | null;
  price?: string | number;
  category?: string | null;
};

type FormState = {
  title: string;
  description: string;
  campaign_type: CampaignType;
  placement: CampaignPlacement;
  product_id: string;
  popup_delay_seconds: string;
  display_duration_seconds: string;
  allow_skip_after_seconds: string;
  priority: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

const emptyForm = (): FormState => ({
  title: '',
  description: '',
  campaign_type: 'IMAGE',
  placement: 'LANDING_POPUP',
  product_id: '',
  popup_delay_seconds: '3',
  display_duration_seconds: '15',
  allow_skip_after_seconds: '3',
  priority: '0',
  start_date: '',
  end_date: '',
  is_active: true,
});

function toDatetimeLocal(value?: string | null) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function campaignToForm(c: Campaign): FormState {
  return {
    title: c.title || '',
    description: c.description || '',
    campaign_type: c.campaign_type,
    placement: c.placement,
    product_id: c.product_id || c.product?.id || '',
    popup_delay_seconds: String(c.popup_delay_seconds ?? 0),
    display_duration_seconds: String(c.display_duration_seconds ?? 0),
    allow_skip_after_seconds: String(c.allow_skip_after_seconds ?? 0),
    priority: String(c.priority ?? 0),
    start_date: toDatetimeLocal(c.start_date),
    end_date: toDatetimeLocal(c.end_date),
    is_active: c.is_active !== false,
  };
}

function formToPayload(form: FormState): CampaignPayload {
  const num = (v: string) => {
    if (!v.trim()) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    campaign_type: form.campaign_type,
    placement: form.placement,
    product_id: form.campaign_type === 'PROMOTED_PRODUCT' ? form.product_id || null : null,
    popup_delay_seconds: num(form.popup_delay_seconds),
    display_duration_seconds: num(form.display_duration_seconds),
    allow_skip_after_seconds: num(form.allow_skip_after_seconds),
    priority: num(form.priority) ?? 0,
    start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
    end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
    is_active: form.is_active,
  };
}

function campaignStatus(c: Campaign): 'active' | 'scheduled' | 'expired' | 'inactive' {
  if (c.is_active === false) return 'inactive';
  const now = Date.now();
  const start = c.start_date ? new Date(c.start_date).getTime() : null;
  const end = c.end_date ? new Date(c.end_date).getTime() : null;
  if (end != null && !Number.isNaN(end) && end < now) return 'expired';
  if (start != null && !Number.isNaN(start) && start > now) return 'scheduled';
  return 'active';
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  scheduled: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  expired: 'bg-white/10 text-white/50 border-white/15',
  inactive: 'bg-red-500/10 text-red-300 border-red-500/25',
};

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<CampaignStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatusFilter>('');
  const [placementFilter, setPlacementFilter] = useState<CampaignPlacement | ''>('');
  const [typeFilter, setTypeFilter] = useState<CampaignType | ''>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [listRes, statsRes] = await Promise.all([
        fetchAdminCampaigns({
          status: statusFilter,
          placement: placementFilter,
          type: typeFilter,
          limit: 100,
        }),
        fetchAdminCampaignStats(),
      ]);
      setCampaigns(listRes.campaigns);
      setStats(statsRes);
    } catch {
      setError('Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, placementFilter, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    fetch(`${API_URL}/admin/products`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success || Array.isArray(data.products)) {
          setProducts(data.products || []);
        }
      })
      .catch(() => undefined);
  }, []);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products.slice(0, 40);
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)).slice(0, 40);
  }, [products, productSearch]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setMediaFile(null);
    setThumbnailFile(null);
    setMediaPreview(null);
    setFormMsg('');
    setShowPreview(false);
    setModalOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm(campaignToForm(c));
    setMediaFile(null);
    setThumbnailFile(null);
    setMediaPreview(c.media_url || c.thumbnail_url || null);
    setFormMsg('');
    setShowPreview(false);
    setModalOpen(true);
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setMediaFile(file);
    if (file) {
      setMediaPreview(URL.createObjectURL(file));
      if (file.type.startsWith('video/')) {
        setForm((prev) => ({ ...prev, campaign_type: 'VIDEO' }));
      } else if (file.type.startsWith('image/') && form.campaign_type === 'VIDEO') {
        setForm((prev) => ({ ...prev, campaign_type: 'IMAGE' }));
      }
    }
    e.target.value = '';
  };

  const previewCampaign: Campaign = {
    id: editing?.id || 'preview',
    title: form.title || 'Untitled campaign',
    description: form.description,
    campaign_type: form.campaign_type,
    placement: form.placement,
    media_url: mediaPreview || editing?.media_url || null,
    thumbnail_url: editing?.thumbnail_url || null,
    product_id: form.product_id || null,
    product: products.find((p) => p.id === form.product_id)
      ? {
          id: form.product_id,
          name: products.find((p) => p.id === form.product_id)?.name,
          image_url: products.find((p) => p.id === form.product_id)?.image_url,
          image: products.find((p) => p.id === form.product_id)?.image,
          price: products.find((p) => p.id === form.product_id)?.price,
          category: products.find((p) => p.id === form.product_id)?.category,
        }
      : editing?.product || null,
    priority: Number(form.priority) || 0,
    is_active: form.is_active,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormMsg('Title is required.');
      return;
    }
    if (form.campaign_type === 'PROMOTED_PRODUCT' && !form.product_id) {
      setFormMsg('Select a product for promoted product campaigns.');
      return;
    }
    if ((form.campaign_type === 'IMAGE' || form.campaign_type === 'VIDEO') && !mediaFile && !editing?.media_url) {
      setFormMsg('Upload media for image/video campaigns.');
      return;
    }

    setSaving(true);
    setFormMsg('');
    const payload = formToPayload(form);
    const files = { media: mediaFile, thumbnail: thumbnailFile };

    try {
      const result = editing
        ? await updateAdminCampaign(editing.id, payload, files)
        : await createAdminCampaign(payload, files);

      if (result.ok) {
        setModalOpen(false);
        load();
      } else {
        setFormMsg(result.message || 'Save failed.');
      }
    } catch {
      setFormMsg('Connection error.');
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (id: string, action: 'activate' | 'deactivate' | 'delete') => {
    if (action === 'delete' && !confirm('Delete this campaign permanently?')) return;
    setActionId(id);
    try {
      const result =
        action === 'activate'
          ? await activateAdminCampaign(id)
          : action === 'deactivate'
            ? await deactivateAdminCampaign(id)
            : await deleteAdminCampaign(id);
      if (result.ok) {
        await load();
      } else {
        alert(result.message || `Failed to ${action}.`);
      }
    } catch {
      alert('Connection error.');
    } finally {
      setActionId(null);
    }
  };

  const statCards = [
    { label: 'Active', value: stats.active ?? campaigns.filter((c) => campaignStatus(c) === 'active').length, tone: 'text-emerald-300' },
    { label: 'Scheduled', value: stats.scheduled ?? campaigns.filter((c) => campaignStatus(c) === 'scheduled').length, tone: 'text-blue-300' },
    { label: 'Expired', value: stats.expired ?? campaigns.filter((c) => campaignStatus(c) === 'expired').length, tone: 'text-white/50' },
    { label: 'Total views', value: stats.total_views ?? campaigns.reduce((sum, c) => sum + (c.view_count || 0), 0), tone: 'text-purple-300' },
    {
      label: 'Most viewed',
      value: stats.most_viewed?.title || stats.most_viewed_title || '—',
      tone: 'text-white',
      sub: stats.most_viewed?.view_count ?? stats.most_viewed_views,
    },
  ];

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50';
  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-white/40 mb-1.5';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Campaigns</h1>
          <p className="text-white/40 text-sm mt-1">Internal Cbrixi promos &amp; announcements</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:opacity-95 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">{card.label}</p>
            <p className={`mt-2 text-xl font-bold truncate ${card.tone}`}>{card.value}</p>
            {card.sub != null && <p className="text-xs text-white/40 mt-1">{card.sub} views</p>}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CampaignStatusFilter)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="expired">Expired</option>
        </select>
        <select
          value={placementFilter}
          onChange={(e) => setPlacementFilter(e.target.value as CampaignPlacement | '')}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        >
          <option value="">All placements</option>
          {CAMPAIGN_PLACEMENTS.map((p) => (
            <option key={p} value={p}>{placementLabel(p)}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as CampaignType | '')}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        >
          <option value="">All types</option>
          {CAMPAIGN_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="w-8 h-8 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] py-16 text-center">
          <p className="text-white/50">No campaigns yet.</p>
          <button type="button" onClick={openCreate} className="mt-4 text-sm text-blue-400 hover:text-blue-300">
            Create your first campaign
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const status = campaignStatus(c);
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">{c.title}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>
                      {status}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35 border border-white/10 rounded-full px-2 py-0.5">
                      {c.campaign_type}
                    </span>
                  </div>
                  <p className="text-xs text-white/40">
                    {placementLabel(c.placement)} · priority {c.priority ?? 0}
                    {c.view_count != null ? ` · ${c.view_count} views` : ''}
                  </p>
                  {c.description && <p className="mt-1 text-sm text-white/55 line-clamp-1">{c.description}</p>}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/5"
                  >
                    Edit
                  </button>
                  {c.is_active === false ? (
                    <button
                      type="button"
                      disabled={actionId === c.id}
                      onClick={() => runAction(c.id, 'activate')}
                      className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
                    >
                      Activate
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionId === c.id}
                      onClick={() => runAction(c.id, 'deactivate')}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-white/5 disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={actionId === c.id}
                    onClick={() => runAction(c.id, 'delete')}
                    className="rounded-lg border border-red-500/25 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 pt-10 sm:pt-16"
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0c0c12] shadow-2xl mb-10"
            >
              <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                <h2 className="text-lg font-bold text-white">{editing ? 'Edit campaign' : 'New campaign'}</h2>
                <button type="button" onClick={() => setModalOpen(false)} className="text-white/50 hover:text-white p-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className={labelClass}>Title</label>
                  <input
                    className={inputClass}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Campaign title"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    className={`${inputClass} min-h-[80px] resize-y`}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Type</label>
                    <select
                      className={inputClass}
                      value={form.campaign_type}
                      onChange={(e) => setForm({ ...form, campaign_type: e.target.value as CampaignType })}
                    >
                      {CAMPAIGN_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Placement</label>
                    <select
                      className={inputClass}
                      value={form.placement}
                      onChange={(e) => setForm({ ...form, placement: e.target.value as CampaignPlacement })}
                    >
                      {CAMPAIGN_PLACEMENTS.map((p) => (
                        <option key={p} value={p}>{placementLabel(p)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {(form.campaign_type === 'IMAGE' || form.campaign_type === 'VIDEO') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Media ({form.campaign_type === 'VIDEO' ? 'video' : 'image'})</label>
                      <input
                        type="file"
                        accept={form.campaign_type === 'VIDEO' ? 'video/*' : 'image/*'}
                        onChange={handleMediaChange}
                        className="block w-full text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-500/20 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-blue-300"
                      />
                      {mediaPreview && form.campaign_type === 'IMAGE' && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaPreview} alt="Preview" className="mt-2 h-24 rounded-lg object-cover border border-white/10" />
                      )}
                      {mediaPreview && form.campaign_type === 'VIDEO' && (
                        <video src={mediaPreview} className="mt-2 h-24 rounded-lg object-cover border border-white/10" muted />
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>Thumbnail (optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-500/20 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-blue-300"
                      />
                    </div>
                  </div>
                )}

                {form.campaign_type === 'PROMOTED_PRODUCT' && (
                  <div>
                    <label className={labelClass}>Product</label>
                    <input
                      className={`${inputClass} mb-2`}
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search products…"
                    />
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/5">
                      {filteredProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setForm({ ...form, product_id: p.id })}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-white/5 ${
                            form.product_id === p.id ? 'bg-blue-500/15 text-blue-200' : 'text-white/70'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.image_url || p.image || '/images/smartwatch.png'}
                            alt=""
                            className="h-8 w-8 rounded object-contain bg-white/5"
                          />
                          <span className="truncate">{p.name}</span>
                        </button>
                      ))}
                      {!filteredProducts.length && (
                        <p className="px-3 py-4 text-xs text-white/40">No products found.</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className={labelClass}>Popup delay (s)</label>
                    <input
                      type="number"
                      min={0}
                      className={inputClass}
                      value={form.popup_delay_seconds}
                      onChange={(e) => setForm({ ...form, popup_delay_seconds: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Display (s)</label>
                    <input
                      type="number"
                      min={0}
                      className={inputClass}
                      value={form.display_duration_seconds}
                      onChange={(e) => setForm({ ...form, display_duration_seconds: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Skip after (s)</label>
                    <input
                      type="number"
                      min={0}
                      className={inputClass}
                      value={form.allow_skip_after_seconds}
                      onChange={(e) => setForm({ ...form, allow_skip_after_seconds: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Priority</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Start date</label>
                    <input
                      type="datetime-local"
                      className={inputClass}
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>End date</label>
                    <input
                      type="datetime-local"
                      className={inputClass}
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/40"
                  />
                  Active on create / save
                </label>

                {showPreview && (
                  <div className="rounded-xl border border-white/10 bg-black/40 p-4 overflow-hidden">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-3">Preview</p>
                    <CampaignContent campaign={previewCampaign} compact />
                  </div>
                )}

                {formMsg && (
                  <p className="text-sm text-red-300">{formMsg}</p>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/8">
                  <button
                    type="button"
                    onClick={() => setShowPreview((v) => !v)}
                    className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/5"
                  >
                    {showPreview ? 'Hide preview' : 'Preview'}
                  </button>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/60 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
