'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import {
  deleteAdminHeroCarouselSlide,
  fetchAdminHeroCarouselSlides,
  saveAdminHeroCarouselSlide,
  setAdminHeroCarouselActive,
  type HeroCarouselSlide,
  type HeroTextPosition,
} from '@/lib/heroCarousel';

const emptyForm = {
  title: '',
  eyebrow: '',
  subtitle: '',
  description: '',
  image_url: '',
  mobile_image_url: '',
  alt_text: '',
  link_url: '',
  product_id: '',
  badge_text: '',
  accent_color: '#60a5fa',
  text_position: 'LEFT' as HeroTextPosition,
  display_order: '1',
  autoplay_seconds: '6',
  start_date: '',
  end_date: '',
  is_active: true,
};

type FormState = typeof emptyForm;

function slideToForm(slide: HeroCarouselSlide): FormState {
  return {
    title: slide.title ?? '',
    eyebrow: slide.eyebrow ?? '',
    subtitle: slide.subtitle ?? '',
    description: slide.description ?? '',
    image_url: slide.image_url ?? '',
    mobile_image_url: slide.mobile_image_url ?? '',
    alt_text: slide.alt_text ?? '',
    link_url: slide.link_url ?? '',
    product_id: slide.product_id ?? '',
    badge_text: slide.badge_text ?? '',
    accent_color: slide.accent_color ?? '#60a5fa',
    text_position: slide.text_position ?? 'LEFT',
    display_order: String(slide.display_order ?? 1),
    autoplay_seconds: String(slide.autoplay_seconds ?? 6),
    start_date: slide.start_date ? slide.start_date.slice(0, 10) : '',
    end_date: slide.end_date ? slide.end_date.slice(0, 10) : '',
    is_active: slide.is_active !== false,
  };
}

export default function AdminHeroCarouselPage() {
  const [slides, setSlides] = useState<HeroCarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<HeroCarouselSlide | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadSlides = useCallback(async () => {
    setLoading(true);
    setError('');
    const result = await fetchAdminHeroCarouselSlides({ status: 'all', page: 1, limit: 20 });
    if (result.ok) setSlides(result.slides);
    else setError(result.message || 'Failed to load hero slides.');
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSlides().catch(() => {
        setError('Failed to load hero slides.');
        setLoading(false);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSlides]);

  const updateForm = (key: keyof FormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
    setMessage('');
  };

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setMobileImageFile(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing && !imageFile && !form.image_url.trim()) {
      setError('Upload an image or provide an image URL.');
      return;
    }

    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'is_active') body.append(key, String(value));
      else if (key === 'title') body.append(key, String(value).trim());
      else if (String(value).trim()) body.append(key, String(value).trim());
    });
    if (imageFile) body.append('image', imageFile);
    if (mobileImageFile) body.append('mobile_image', mobileImageFile);

    setSaving(true);
    setError('');
    setMessage('');
    const result = await saveAdminHeroCarouselSlide(editing?.id ?? null, body);
    if (result.ok) {
      setMessage(editing ? 'Hero slide updated.' : 'Hero slide created.');
      resetForm();
      await loadSlides();
    } else {
      setError(result.message || 'Failed to save hero slide.');
    }
    setSaving(false);
  };

  const handleToggle = async (slide: HeroCarouselSlide) => {
    setProcessingId(slide.id);
    setError('');
    const result = await setAdminHeroCarouselActive(slide.id, slide.is_active === false);
    if (result.ok) await loadSlides();
    else setError(result.message || 'Failed to update slide status.');
    setProcessingId(null);
  };

  const handleDelete = async (slide: HeroCarouselSlide) => {
    if (!confirm(`Delete "${slide.title || 'Image-only slide'}" permanently?`)) return;
    setProcessingId(slide.id);
    setError('');
    const result = await deleteAdminHeroCarouselSlide(slide.id);
    if (result.ok) setSlides((current) => current.filter((item) => item.id !== slide.id));
    else setError(result.message || 'Failed to delete slide.');
    setProcessingId(null);
  };

  return (
    <div className="min-h-screen p-4 pb-10 sm:p-8 text-white">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hero Carousel</h1>
          <p className="mt-1 text-sm text-white/45">Manage homepage hero adverts separately from campaigns.</p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="w-fit rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/10"
        >
          New slide
        </button>
      </div>

      {(error || message) && (
        <div className={`mb-6 rounded-xl border p-4 text-sm ${error ? 'border-red-500/25 bg-red-500/10 text-red-300' : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'}`}>
          {error || message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-2xl border border-white/8 bg-white/[0.03]">
          <div className="border-b border-white/8 px-5 py-4">
            <h2 className="font-semibold">Slides</h2>
          </div>
          {loading ? (
            <p className="p-8 text-white/45">Loading slides...</p>
          ) : slides.length === 0 ? (
            <p className="p-8 text-white/45">No hero slides yet.</p>
          ) : (
            <div className="divide-y divide-white/8">
              {slides.map((slide) => (
                <div key={slide.id} className="grid gap-4 p-5 lg:grid-cols-[160px_minmax(0,1fr)_auto]">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-white/5">
                    <Image src={slide.image_url} alt={slide.alt_text || slide.title || 'Hero carousel slide'} fill sizes="160px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${slide.is_active === false ? 'border-yellow-500/25 bg-yellow-500/10 text-yellow-300' : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'}`}>
                        {slide.is_active === false ? 'Inactive' : 'Active'}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/45">
                        Order {slide.display_order ?? '-'}
                      </span>
                    </div>
                    <h3 className="truncate text-lg font-bold">{slide.title || 'Image-only slide'}</h3>
                    {slide.subtitle && <p className="truncate text-sm text-white/60">{slide.subtitle}</p>}
                    {slide.description && <p className="mt-1 line-clamp-2 text-sm text-white/40">{slide.description}</p>}
                    <p className="mt-2 text-xs text-white/35">{slide.text_position ?? 'LEFT'} · {slide.autoplay_seconds ?? 6}s</p>
                  </div>
                  <div className="flex flex-wrap items-start gap-2 lg:flex-col">
                    <button type="button" onClick={() => { setEditing(slide); setForm(slideToForm(slide)); setImageFile(null); setMobileImageFile(null); }} className="rounded-lg border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-500/20">
                      Edit
                    </button>
                    <button type="button" disabled={processingId === slide.id} onClick={() => handleToggle(slide)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10 disabled:opacity-50">
                      {slide.is_active === false ? 'Activate' : 'Deactivate'}
                    </button>
                    <button type="button" disabled={processingId === slide.id} onClick={() => handleDelete(slide)} className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
          <h2 className="mb-5 text-lg font-semibold">{editing ? 'Edit slide' : 'New slide'}</h2>
          <div className="space-y-4">
            <Field label="Title"><input value={form.title} onChange={(e) => updateForm('title', e.target.value)} placeholder="Optional" className={inputClass} /></Field>
            <Field label="Eyebrow"><input value={form.eyebrow} onChange={(e) => updateForm('eyebrow', e.target.value)} className={inputClass} /></Field>
            <Field label="Subtitle"><input value={form.subtitle} onChange={(e) => updateForm('subtitle', e.target.value)} className={inputClass} /></Field>
            <Field label="Description"><textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} rows={3} className={`${inputClass} resize-none`} /></Field>
            <Field label="Desktop image"><input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} className={inputClass} /></Field>
            <Field label="Desktop image URL"><input value={form.image_url} onChange={(e) => updateForm('image_url', e.target.value)} className={inputClass} /></Field>
            <Field label="Mobile image"><input type="file" accept="image/*" onChange={(e) => setMobileImageFile(e.target.files?.[0] ?? null)} className={inputClass} /></Field>
            <Field label="Mobile image URL"><input value={form.mobile_image_url} onChange={(e) => updateForm('mobile_image_url', e.target.value)} className={inputClass} /></Field>
            <Field label="Alt text"><input value={form.alt_text} onChange={(e) => updateForm('alt_text', e.target.value)} className={inputClass} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Link URL"><input value={form.link_url} onChange={(e) => updateForm('link_url', e.target.value)} className={inputClass} /></Field>
              <Field label="Product ID"><input value={form.product_id} onChange={(e) => updateForm('product_id', e.target.value)} className={inputClass} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Badge"><input value={form.badge_text} onChange={(e) => updateForm('badge_text', e.target.value)} className={inputClass} /></Field>
              <Field label="Accent"><input type="color" value={form.accent_color} onChange={(e) => updateForm('accent_color', e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-2" /></Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Position"><select value={form.text_position} onChange={(e) => updateForm('text_position', e.target.value as HeroTextPosition)} className={inputClass}>{['LEFT', 'CENTER', 'RIGHT'].map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
              <Field label="Order"><input type="number" value={form.display_order} onChange={(e) => updateForm('display_order', e.target.value)} className={inputClass} /></Field>
              <Field label="Seconds"><input type="number" min="3" value={form.autoplay_seconds} onChange={(e) => updateForm('autoplay_seconds', e.target.value)} className={inputClass} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start date"><input type="date" value={form.start_date} onChange={(e) => updateForm('start_date', e.target.value)} className={inputClass} /></Field>
              <Field label="End date"><input type="date" value={form.end_date} onChange={(e) => updateForm('end_date', e.target.value)} className={inputClass} /></Field>
            </div>
            <label className="flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm text-white/70">
              Active
              <input type="checkbox" checked={form.is_active} onChange={(e) => updateForm('is_active', e.target.checked)} />
            </label>
            <button type="submit" disabled={saving} className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
              {saving ? 'Saving...' : editing ? 'Save changes' : 'Create slide'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass = 'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400';

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-white/45">{label}{required ? ' *' : ''}</span>
      {children}
    </label>
  );
}
