'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ReceiptDetailView from '@/components/receipts/ReceiptDetailView';
import { ReceiptApiError, type Receipt, type ReceiptCustomDetail, type ReceiptItem } from '@/lib/receipts';
import { downloadClientReceiptPdf, printClientReceipt } from '@/lib/receiptPrint';
import { toNumber } from '@/lib/pricing';

type ManualItem = {
  id: string;
  name: string;
  quantity: string;
  price: string;
};

type ManualDetail = ReceiptCustomDetail & {
  id: string;
};

const company = {
  name: 'CBRIXI',
  tagline: 'Smart gadgets and connected living',
  email: 'support@cbrixi.com',
  phone: '',
  address: '',
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayReceiptNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `MANUAL-${stamp}`;
}

export default function AdminReceiptCreatorPage() {
  const [receiptNumber, setReceiptNumber] = useState(todayReceiptNumber);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [items, setItems] = useState<ManualItem[]>([
    { id: makeId('item'), name: '', quantity: '1', price: '' },
  ]);
  const [details, setDetails] = useState<ManualDetail[]>([
    { id: makeId('detail'), key: '', value: '' },
  ]);
  const [busy, setBusy] = useState<'print' | 'download' | ''>('');
  const [message, setMessage] = useState('');

  const receipt = useMemo<Receipt>(() => {
    const receiptItems: ReceiptItem[] = items
      .filter((item) => item.name.trim() || item.price.trim())
      .map((item) => {
        const qty = Math.max(1, toNumber(item.quantity || 1));
        const unitPrice = toNumber(item.price);
        return {
          id: item.id,
          name: item.name.trim() || 'Item',
          quantity: qty,
          unit_price: unitPrice,
          line_total: qty * unitPrice,
        };
      });
    const total = receiptItems.reduce((sum, item) => sum + toNumber(item.line_total), 0);

    return {
      receipt_number: receiptNumber.trim() || todayReceiptNumber(),
      invoice_number: invoiceNumber.trim() || null,
      customer_name: customerName.trim() || null,
      customer_email: customerEmail.trim() || null,
      customer_phone: customerPhone.trim() || null,
      payment_method: paymentMethod.trim() || null,
      payment_reference: paymentReference.trim() || null,
      issued_at: new Date().toISOString(),
      amount_paid: total,
      total_amount: total,
      remaining_balance: 0,
      items: receiptItems,
      custom_details: details
        .filter((detail) => detail.key.trim() || detail.value.trim())
        .map(({ key, value }) => ({ key: key.trim(), value: value.trim() })),
      company,
    };
  }, [customerEmail, customerName, customerPhone, details, invoiceNumber, items, paymentMethod, paymentReference, receiptNumber]);

  const updateItem = (id: string, field: keyof Omit<ManualItem, 'id'>, value: string) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const updateDetail = (id: string, field: 'key' | 'value', value: string) => {
    setDetails((current) => current.map((detail) => (detail.id === id ? { ...detail, [field]: value } : detail)));
  };

  const runAction = async (action: 'print' | 'download') => {
    setBusy(action);
    setMessage('');
    try {
      if (action === 'print') await printClientReceipt(receipt);
      else await downloadClientReceiptPdf(receipt);
    } catch (err) {
      setMessage(err instanceof ReceiptApiError ? err.message : 'Receipt action failed.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="p-4 pb-8 sm:p-8 min-h-screen max-w-[100vw]">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Receipt Creator</h1>
        <p className="mt-1 text-white/40 text-sm leading-relaxed">
          Create a one-off receipt for print or PDF download. Nothing entered here is saved.
        </p>
      </motion.div>

      {message ? (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(360px,520px)_1fr] gap-6 items-start">
        <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 sm:p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Receipt number" value={receiptNumber} onChange={setReceiptNumber} />
            <TextField label="Invoice number" value={invoiceNumber} onChange={setInvoiceNumber} />
            <TextField label="Customer name" value={customerName} onChange={setCustomerName} />
            <TextField label="Customer email" value={customerEmail} onChange={setCustomerEmail} />
            <TextField label="Customer phone" value={customerPhone} onChange={setCustomerPhone} />
            <TextField label="Payment method" value={paymentMethod} onChange={setPaymentMethod} />
          </div>
          <TextField label="Payment reference" value={paymentReference} onChange={setPaymentReference} />

          <FormSection title="Items">
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_110px_40px] gap-2">
                  <Input value={item.name} onChange={(value) => updateItem(item.id, 'name', value)} placeholder="Item" />
                  <Input value={item.quantity} onChange={(value) => updateItem(item.id, 'quantity', value)} placeholder="Qty" />
                  <Input value={item.price} onChange={(value) => updateItem(item.id, 'price', value)} placeholder="Price" />
                  <IconButton label="Remove item" onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}>
                    X
                  </IconButton>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setItems((current) => [...current, { id: makeId('item'), name: '', quantity: '1', price: '' }])} className="mt-3 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/5">
              Add item
            </button>
          </FormSection>

          <FormSection title="Details">
            <div className="space-y-3">
              {details.map((detail) => (
                <div key={detail.id} className="grid grid-cols-1 sm:grid-cols-[160px_1fr_40px] gap-2">
                  <Input value={detail.key} onChange={(value) => updateDetail(detail.id, 'key', value)} placeholder="Key" />
                  <Input value={detail.value} onChange={(value) => updateDetail(detail.id, 'value', value)} placeholder="Value" />
                  <IconButton label="Remove detail" onClick={() => setDetails((current) => current.filter((row) => row.id !== detail.id))}>
                    X
                  </IconButton>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setDetails((current) => [...current, { id: makeId('detail'), key: '', value: '' }])} className="mt-3 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/5">
              Add detail
            </button>
          </FormSection>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button type="button" onClick={() => runAction('download')} disabled={busy !== ''} className="rounded-xl border border-blue-500/30 bg-blue-500/15 px-4 py-2.5 text-sm font-semibold text-blue-200 hover:bg-blue-500/25 disabled:opacity-50">
              {busy === 'download' ? 'Preparing PDF...' : 'Download PDF'}
            </button>
            <button type="button" onClick={() => runAction('print')} disabled={busy !== ''} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/75 hover:bg-white/5 disabled:opacity-50">
              {busy === 'print' ? 'Opening print...' : 'Print'}
            </button>
          </div>
        </section>

        <section className="min-w-0">
          <ReceiptDetailView receipt={receipt} />
        </section>
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">{title}</h2>
      {children}
    </section>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs text-white/40">{label}</span>
      <Input value={value} onChange={onChange} />
    </label>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/30"
    />
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-lg leading-none text-white/55 hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
