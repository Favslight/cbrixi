import {
  receiptAmountPaid,
  receiptItemLabel,
  receiptItemTotal,
  receiptRemainingBalance,
  ReceiptApiError,
  type Receipt,
} from '@/lib/receipts';
import { formatMoney } from '@/lib/pricing';

/** Same asset as browser tab icon (`layout.tsx` metadata → `/favicon.png`). */
const RECEIPT_LOGO = '/favicon.png';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function absoluteUrl(src: string): string {
  if (!src) return src;
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  if (typeof window === 'undefined') return src;
  try {
    return new URL(src, window.location.origin).href;
  } catch {
    return src;
  }
}

function textOrDash(value?: string | null): string {
  const trimmed = value?.trim();
  return trimmed ? escapeHtml(trimmed) : '—';
}

/**
 * Printable HTML that mirrors ReceiptDetailView branding:
 * blue header, favicon logo (white via CSS filter), white company name,
 * invoice number — no internal id / order_id / payment_id.
 */
export function buildClientReceiptHtml(receipt: Receipt): string {
  const company = receipt.company;
  const items = receipt.items ?? [];
  const amountPaid = receiptAmountPaid(receipt);
  const remaining = receiptRemainingBalance(receipt);
  const orderTotal = receipt.total_amount ?? receipt.order_total ?? receipt.order?.total_amount;
  const issued = receipt.issued_at ?? receipt.payment_date ?? receipt.created_at;
  const companyName = company?.name || company?.legal_name || 'CBRIXI';
  const companyEmail = company?.email || company?.support_email;
  const logoSrc = absoluteUrl(RECEIPT_LOGO);
  const customerEmail = receipt.customer_email || receipt.email;
  const customerPhone = receipt.customer_phone || receipt.phone;
  const paymentRef =
    receipt.payment_reference || receipt.reference || receipt.payment?.reference || null;
  const paymentMethod = receipt.payment_method || receipt.payment?.payment_method || null;
  const invoiceNumber = receipt.invoice_number?.trim() || null;
  const customDetails = (receipt.custom_details ?? []).filter(
    (detail) => detail.key.trim() || detail.value.trim()
  );

  const itemRows =
    items.length === 0
      ? `<tr><td colspan="3" class="muted">No line items on this receipt.</td></tr>`
      : items
          .map((item) => {
            const label = escapeHtml(receiptItemLabel(item));
            const variant = item.variant_name
              ? `<div class="variant">${escapeHtml(item.variant_name)}</div>`
              : '';
            const qty = escapeHtml(String(item.quantity ?? 1));
            const total = escapeHtml(formatMoney(receiptItemTotal(item)));
            return `<tr>
              <td><div class="item-name">${label}</div>${variant}</td>
              <td class="num">${qty}</td>
              <td class="num strong">${total}</td>
            </tr>`;
          })
          .join('');

  const customerNameBlock = receipt.customer_name
    ? `<p class="customer-name">${escapeHtml(receipt.customer_name)}</p>`
    : '';

  const invoiceHeaderBlock = invoiceNumber
    ? `<p class="invoice-number">Invoice ${escapeHtml(invoiceNumber)}</p>`
    : '';

  const invoiceDlRow = invoiceNumber
    ? `<div class="dl-row"><dt>Invoice</dt><dd class="mono">${escapeHtml(invoiceNumber)}</dd></div>`
    : '';

  const customDetailsBlock = customDetails.length
    ? `<h2 class="section-title detail-heading">Details</h2>
      <div class="details">
        ${customDetails
          .map(
            (detail) => `<div class="detail-row">
              <dt>${escapeHtml(detail.key.trim() || 'Detail')}</dt>
              <dd>${escapeHtml(detail.value.trim() || '—')}</dd>
            </div>`
          )
          .join('')}
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Receipt ${escapeHtml(receipt.receipt_number)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
    background: #f4f6fb;
    color: #0f172a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
  }
  .sheet {
    max-width: 760px;
    margin: 24px auto;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
  }
  .header {
    background: linear-gradient(90deg, #1d4ed8 0%, #2563eb 50%, #4338ca 100%);
    color: #fff;
    padding: 22px 28px;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  .header-row {
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }
  .header img {
    height: 40px;
    width: auto;
    max-width: 48px;
    object-fit: contain;
    filter: brightness(0) invert(1);
    -webkit-filter: brightness(0) invert(1);
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  .brand-name {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #ffffff;
  }
  .eyebrow {
    margin: 10px 0 0;
    font-size: 11px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.72);
    font-weight: 700;
  }
  .receipt-number {
    margin: 6px 0 0;
    font-size: 20px;
    font-weight: 700;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    word-break: break-all;
  }
  .invoice-number {
    margin: 8px 0 0;
    font-size: 14px;
    color: rgba(255,255,255,0.92);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    word-break: break-all;
  }
  .issued {
    margin: 6px 0 0;
    font-size: 14px;
    color: rgba(255,255,255,0.68);
  }
  .body { padding: 24px 28px 28px; }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .section-title {
    margin: 0 0 10px;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #94a3b8;
    font-weight: 700;
  }
  .company-name, .customer-name {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
  }
  .muted { color: #64748b; font-size: 13px; margin: 4px 0 0; white-space: pre-line; }
  .dl { margin: 8px 0 0; font-size: 13px; }
  .dl-row { display: flex; flex-wrap: wrap; gap: 8px; margin: 4px 0; }
  .dl-row dt { color: #94a3b8; min-width: 48px; }
  .dl-row dd { margin: 0; color: #334155; word-break: break-all; }
  .dl-row dd.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  .meta { margin: 10px 0 0; font-size: 12px; color: #64748b; word-break: break-all; }
  .metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin: 22px 0;
  }
  .metric {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #f8fafc;
    padding: 12px 14px;
  }
  .metric-label { margin: 0 0 4px; font-size: 11px; color: #94a3b8; }
  .metric-value { margin: 0; font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .metric-value.paid { color: #059669; font-size: 18px; }
  table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
  }
  th, td {
    padding: 12px 14px;
    text-align: left;
    border-bottom: 1px solid #f1f5f9;
    font-size: 13px;
    vertical-align: top;
  }
  th {
    background: #f8fafc;
    color: #94a3b8;
    font-weight: 600;
  }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  .item-name { font-weight: 600; color: #0f172a; }
  .variant { margin-top: 2px; font-size: 12px; color: #94a3b8; }
  .strong { font-weight: 700; }
  .detail-heading { margin-top: 22px; }
  .details {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
  }
  .detail-row {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 14px;
    padding: 12px 14px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 13px;
  }
  .detail-row:last-child { border-bottom: 0; }
  .detail-row dt { color: #64748b; font-weight: 600; word-break: break-word; }
  .detail-row dd { margin: 0; color: #334155; white-space: pre-line; word-break: break-word; }
  @media print {
    body { background: #fff; }
    .sheet {
      margin: 0;
      border: none;
      border-radius: 0;
      max-width: none;
    }
    .header,
    .header img,
    .metric {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
  }
  @media (max-width: 640px) {
    .grid, .metrics, .detail-row { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
  <article class="sheet" id="receipt-root">
    <header class="header">
      <div class="header-row">
        <img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(companyName)}" />
        <div>
          <p class="brand-name">${escapeHtml(companyName)}</p>
          <p class="eyebrow">Receipt</p>
          <h1 class="receipt-number">${escapeHtml(receipt.receipt_number)}</h1>
          ${invoiceHeaderBlock}
          <p class="issued">Issued ${escapeHtml(fmtDate(issued))}</p>
        </div>
      </div>
    </header>
    <div class="body">
      <div class="grid">
        <section>
          <h2 class="section-title">Company</h2>
          <p class="company-name">${escapeHtml(companyName)}</p>
          ${company?.tagline ? `<p class="muted">${escapeHtml(company.tagline)}</p>` : ''}
          ${company?.address ? `<p class="muted">${escapeHtml(company.address)}</p>` : ''}
          ${companyEmail ? `<p class="muted">${escapeHtml(companyEmail)}</p>` : ''}
          ${company?.phone ? `<p class="muted">${escapeHtml(company.phone)}</p>` : ''}
        </section>
        <section>
          <h2 class="section-title">Customer</h2>
          ${customerNameBlock}
          <dl class="dl">
            <div class="dl-row"><dt>Email</dt><dd>${textOrDash(customerEmail)}</dd></div>
            <div class="dl-row"><dt>Phone</dt><dd>${textOrDash(customerPhone)}</dd></div>
            ${invoiceDlRow}
          </dl>
          ${paymentRef ? `<p class="meta">Ref: ${escapeHtml(paymentRef)}</p>` : ''}
          ${paymentMethod ? `<p class="meta">Method: ${escapeHtml(paymentMethod)}</p>` : ''}
        </section>
      </div>

      <div class="metrics">
        <div class="metric">
          <p class="metric-label">Amount paid</p>
          <p class="metric-value paid">${escapeHtml(formatMoney(amountPaid))}</p>
        </div>
        <div class="metric">
          <p class="metric-label">Order total</p>
          <p class="metric-value">${orderTotal != null ? escapeHtml(formatMoney(orderTotal)) : '—'}</p>
        </div>
        <div class="metric">
          <p class="metric-label">Remaining balance</p>
          <p class="metric-value">${remaining != null ? escapeHtml(formatMoney(remaining)) : '—'}</p>
        </div>
      </div>

      <h2 class="section-title">Items</h2>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="num">Qty</th>
            <th class="num">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      ${customDetailsBlock}
    </div>
  </article>
</body>
</html>`;
}

function waitForImages(doc: Document): Promise<void> {
  const images = Array.from(doc.images);
  if (images.length === 0) return Promise.resolve();
  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  ).then(() => undefined);
}

/** Open the client receipt HTML and trigger the browser print dialog. */
export async function printClientReceipt(receipt: Receipt): Promise<void> {
  const html = buildClientReceiptHtml(receipt);
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) {
    throw new ReceiptApiError('Popup blocked. Allow popups to print the receipt.');
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  await waitForImages(win.document);
  // Give layout/paint a tick before printing
  await new Promise((r) => setTimeout(r, 50));
  win.focus();
  win.print();
}

async function renderReceiptElement(receipt: Receipt): Promise<HTMLElement> {
  const html = buildClientReceiptHtml(receipt);
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText =
    'position:fixed;left:-10000px;top:0;width:794px;opacity:0;pointer-events:none;z-index:-1;';
  document.body.appendChild(host);

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const sheet = doc.getElementById('receipt-root');
  if (!sheet) {
    host.remove();
    throw new ReceiptApiError('Failed to build printable receipt.');
  }

  // Re-create styles in the host so html2canvas sees computed colors
  const style = document.createElement('style');
  style.textContent = Array.from(doc.querySelectorAll('style'))
    .map((el) => el.textContent || '')
    .join('\n');
  host.appendChild(style);
  host.appendChild(document.importNode(sheet, true));

  await waitForImages(host.ownerDocument);
  await new Promise((r) => requestAnimationFrame(() => r(undefined)));
  return host;
}

/** Export PDF from the same HTML used for Print (html2canvas + jspdf). */
export async function downloadClientReceiptPdf(receipt: Receipt): Promise<void> {
  const host = await renderReceiptElement(receipt);
  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    const target = host.querySelector('#receipt-root') as HTMLElement | null;
    if (!target) throw new ReceiptApiError('Failed to render receipt for PDF.');

    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const usableWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * usableWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      position = margin - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    pdf.save(`${receipt.receipt_number}.pdf`);
  } catch (err) {
    if (err instanceof ReceiptApiError) throw err;
    const message =
      err instanceof Error && /Cannot find module|Failed to fetch dynamically imported/i.test(err.message)
        ? 'PDF export libraries are not installed. Run npm install html2canvas jspdf.'
        : err instanceof Error
          ? err.message
          : 'Failed to generate PDF.';
    throw new ReceiptApiError(message);
  } finally {
    host.remove();
  }
}
