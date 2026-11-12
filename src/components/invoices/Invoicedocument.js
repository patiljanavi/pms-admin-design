// npm i jspdf jspdf-autotable
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { calcTotals, paymentLabel, rowAmount } from "../../data/invoiceTemplates";

/*
 * Print and PDF for invoices.
 * Works with both invoice shapes:
 *   • the app's invoices:  { number, issueDate, dueDate, status/state, paymentMode, description, rows: [{ productName, description, qty, rate, isDiscount, tax }], taxRate, clientNote }
 *     called as printInvoice(invoice, account) / downloadInvoicePdf(invoice, account)
 *   • the older shape:     { invoiceNumber, date, lineItems: [{ name, description, quantity, rate, amount }], subtotal, taxTotal, totalAmount }
 *     called as printInvoice(invoice, { companyInfo, clientInfo, currency })
 */

const DEFAULT_COMPANY = { name: "Harbor Accounting", email: "hello@harbor.dev", address: "" };
const STATUS_LABEL = { draft: "Draft", sent: "Sent", overdue: "Overdue", paid: "Paid" };

const money = (n, currency = "$") =>
  `${Number(n) < 0 ? "-" : ""}${currency}${Math.abs(Number(n || 0)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const escapeHtml = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** 'YYYY-MM-DD' is read as a local date (no time-zone shift). */
const formatDate = (d) => {
  if (!d) return "";
  const date = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00`) : new Date(d);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

/** Rich-text note → plain text with line breaks. */
const noteText = (html = "") =>
  String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/**
 * One shape for printing: whatever was passed in → { number, date, dueDate, status, paymentMethod, description,
 * items: [{ name, description, quantity, rate, amount, taxed }], subtotal, taxRate, taxTotal, total, note, client, company, currency }.
 */
export function toPrintable(inv = {}, opts = {}) {
  // 2nd argument: an account ({ id, name, … }) or options ({ companyInfo, clientInfo, currency })
  const isAccount = opts && (opts.id || opts.name) && !opts.companyInfo && !opts.clientInfo;
  const account = isAccount ? opts : inv.account || null;
  const { companyInfo = {}, clientInfo = {}, currency = "$" } = isAccount ? {} : opts || {};

  const contact = account?.contacts?.[0] || {};
  const client = clientInfo.name
    ? clientInfo
    : account
      ? {
          name: account.name,
          company: account.company || "",
          contactName: contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" "),
          email: contact.email || account.email || "",
          phone: contact.phone || account.phone || "",
          address: account.address || "",
          id: account.id,
        }
      : inv.client || {};

  // line items: the app's rows, or the older lineItems
  const items = inv.rows?.length
    ? inv.rows.map((r) => ({
        name: r.productName || "Item",
        description: r.description || "",
        quantity: Number(r.qty) || 0,
        rate: r.isDiscount ? -Math.abs(Number(r.rate) || 0) : Number(r.rate) || 0,
        amount: rowAmount(r),
        taxed: !!r.tax,
      }))
    : (inv.lineItems || []).map((it) => ({
        name: it.name || "Item",
        description: it.description || "",
        quantity: Number(it.quantity) || 0,
        rate: Number(it.rate) || 0,
        amount: it.amount != null ? Number(it.amount) : (Number(it.rate) || 0) * (Number(it.quantity) || 0),
        taxed: !!it.tax,
      }));

  const totals = inv.rows?.length ? calcTotals(inv.rows, inv.taxRate) : null;
  const subtotal = inv.subtotal ?? totals?.subtotal ?? items.reduce((n, it) => n + it.amount, 0);
  const taxTotal = inv.taxTotal ?? totals?.taxTotal ?? 0;
  const total = inv.totalAmount ?? totals?.totalAmount ?? inv.total ?? subtotal + taxTotal;
  const state = inv.state || inv.status;

  return {
    number: inv.number || inv.invoiceNumber || "",
    date: inv.issueDate || inv.date || "",
    dueDate: inv.dueDate || "",
    status: STATUS_LABEL[state] || state || "Unpaid",
    paymentMethod: inv.paymentMode ? paymentLabel(inv.paymentMode) : inv.paymentMethod || "",
    description: inv.description || "",
    items,
    subtotal,
    taxRate: Number(inv.taxRate || 0),
    taxTotal,
    total,
    note: noteText(inv.clientNote || ""),
    client,
    company: { ...DEFAULT_COMPANY, ...companyInfo },
    currency,
  };
}

/* ───────────── Print ───────────── */
export function buildInvoiceHtml(inv, opts) {
  const p = toPrintable(inv, opts);
  const c = p.client;
  const rows = p.items
    .map(
      (it) => `<tr>
        <td><strong>${escapeHtml(it.name)}</strong>${it.taxed ? ' <span class="muted">(taxed)</span>' : ""}${it.description ? `<div class="muted">${escapeHtml(it.description)}</div>` : ""}</td>
        <td class="r">${it.quantity}</td>
        <td class="r">${money(it.rate, p.currency)}</td>
        <td class="r">${money(it.amount, p.currency)}</td>
      </tr>`,
    )
    .join("");
  const detail = (label, value) => (value ? `<div><span class="muted">${label}</span> <strong>${escapeHtml(value)}</strong></div>` : "");

  return `<!doctype html><html><head><meta charset="utf-8" />
  <title>Invoice ${escapeHtml(p.number)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color:#111827; margin:40px; font-size:13px; }
    h1 { font-size:22px; margin:0 0 4px; }
    h2 { font-size:20px; letter-spacing:.15em; text-transform:uppercase; color:#6b7280; margin:0 0 8px; }
    .muted { color:#6b7280; font-size:12px; }
    .label { color:#6b7280; font-size:11px; text-transform:uppercase; letter-spacing:.06em; margin-bottom:4px; }
    .top { display:flex; justify-content:space-between; gap:24px; margin-bottom:28px; }
    .parties { display:flex; justify-content:space-between; gap:24px; padding:16px 0; border-top:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb; }
    .r { text-align:right; }
    table { width:100%; border-collapse:collapse; margin-top:20px; }
    th { text-align:left; font-weight:600; border-bottom:2px solid #111827; padding:8px 6px; font-size:11px; text-transform:uppercase; color:#6b7280; }
    td { border-bottom:1px solid #f3f4f6; padding:8px 6px; vertical-align:top; }
    .totals { margin-left:auto; width:280px; margin-top:16px; }
    .totals div { display:flex; justify-content:space-between; padding:4px 0; }
    .grand { font-weight:700; font-size:15px; border-top:1px solid #d1d5db; padding-top:8px !important; }
    .note { margin-top:28px; white-space:pre-wrap; }
    @media print { body { margin:16mm; } }
  </style></head><body>
    <div class="top">
      <div>
        <h1>${escapeHtml(p.company.name)}</h1>
        ${p.company.address ? `<div class="muted">${escapeHtml(p.company.address)}</div>` : ""}
        ${p.company.email ? `<div class="muted">${escapeHtml(p.company.email)}</div>` : ""}
      </div>
      <div class="r">
        <h2>Invoice</h2>
        ${detail("Invoice #", p.number)}
        ${detail("Date", formatDate(p.date))}
        ${detail("Due", formatDate(p.dueDate))}
        ${detail("Status", p.status)}
      </div>
    </div>
    <div class="parties">
      <div>
        <div class="label">Bill to</div>
        <div><strong>${escapeHtml(c.name || "")}</strong></div>
        ${c.company && c.company !== c.name ? `<div>${escapeHtml(c.company)}</div>` : ""}
        ${c.contactName ? `<div class="muted">Attn: ${escapeHtml(c.contactName)}</div>` : ""}
        ${c.email ? `<div class="muted">${escapeHtml(c.email)}</div>` : ""}
        ${c.phone ? `<div class="muted">${escapeHtml(c.phone)}</div>` : ""}
        ${c.address ? `<div class="muted">${escapeHtml(c.address)}</div>` : ""}
      </div>
      <div class="r">
        ${p.paymentMethod ? `<div class="label">Payment method</div><div><strong>${escapeHtml(p.paymentMethod)}</strong></div>` : ""}
      </div>
    </div>
    ${p.description ? `<div style="margin-top:16px"><div class="label">Description</div><div>${escapeHtml(p.description)}</div></div>` : ""}
    <table>
      <thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="4" class="muted">No line items</td></tr>`}</tbody>
    </table>
    <div class="totals">
      <div><span>Subtotal</span><span>${money(p.subtotal, p.currency)}</span></div>
      <div><span>Tax (${p.taxRate}%)</span><span>${money(p.taxTotal, p.currency)}</span></div>
      <div class="grand"><span>Total due</span><span>${money(p.total, p.currency)}</span></div>
    </div>
    ${p.note ? `<div class="note"><div class="label">Note</div>${escapeHtml(p.note)}</div>` : ""}
  </body></html>`;
}

/**
 * Print: opens the invoice in a new window and the print dialog.
 * If the browser blocks the popup, it prints through a hidden frame instead (no error).
 */
export function printInvoice(inv, opts) {
  const html = buildInvoiceHtml(inv, opts);
  const win = window.open("", "_blank", "width=900,height=1000");
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      win.focus();
      win.print();
      win.onafterprint = () => win.close();
    };
    win.onload = go;
    setTimeout(go, 400); // some browsers don't fire onload after document.write
    return true;
  }
  // popup blocked → hidden frame
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  const doc = frame.contentWindow?.document;
  if (!doc) { frame.remove(); return false; }
  doc.open(); doc.write(html); doc.close();
  try { frame.contentWindow.focus(); frame.contentWindow.print?.(); } catch { /* print not available */ }
  setTimeout(() => frame.remove(), 1000);
  return true;
}

/* ───────────── PDF ───────────── */
/** Build the invoice PDF (jsPDF document) without saving it. */
export function createInvoicePdf(inv, opts) {
  const p = toPrintable(inv, opts);
  const c = p.client;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;

  // firm (left) · invoice details (right)
  doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(17).text(p.company.name, M, 56);
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(107);
  let ly = 72;
  if (p.company.address) { doc.text(p.company.address, M, ly); ly += 14; }
  if (p.company.email) { doc.text(p.company.email, M, ly); }

  doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(107).text("INVOICE", W - M, 56, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(17);
  let ry = 74;
  [["Invoice #", p.number], ["Date", formatDate(p.date)], ["Due", formatDate(p.dueDate)], ["Status", p.status]]
    .filter(([, v]) => v)
    .forEach(([l, v]) => { doc.text(`${l}  ${v}`, W - M, ry, { align: "right" }); ry += 14; });

  // bill to (left) · payment method (right)
  let y = Math.max(ly, ry) + 22;
  doc.setDrawColor(229, 231, 235).line(M, y - 12, W - M, y - 12);
  doc.setFontSize(9).setTextColor(107).text("BILL TO", M, y);
  if (p.paymentMethod) doc.text("PAYMENT METHOD", W - M, y, { align: "right" });
  y += 14;
  doc.setFontSize(11).setTextColor(17).setFont("helvetica", "bold").text(c.name || "", M, y);
  if (p.paymentMethod) doc.text(p.paymentMethod, W - M, y, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(10);
  [c.company && c.company !== c.name ? c.company : "", c.contactName ? `Attn: ${c.contactName}` : "", c.email, c.phone, c.address]
    .filter(Boolean)
    .forEach((line) => { y += 13; doc.setTextColor(line === c.company ? 17 : 107).text(line, M, y); });
  y += 18;
  doc.line(M, y - 6, W - M, y - 6);

  if (p.description) {
    y += 10;
    doc.setFontSize(9).setTextColor(107).text("DESCRIPTION", M, y);
    doc.setFontSize(10).setTextColor(17);
    const lines = doc.splitTextToSize(p.description, W - M * 2);
    doc.text(lines, M, y + 14);
    y += 14 + lines.length * 12;
  }

  autoTable(doc, {
    startY: y + 8,
    margin: { left: M, right: M },
    head: [["Item", "Qty", "Rate", "Amount"]],
    body: p.items.length
      ? p.items.map((it) => [
          `${it.name}${it.taxed ? " (taxed)" : ""}${it.description ? `\n${it.description}` : ""}`,
          String(it.quantity),
          money(it.rate, p.currency),
          money(it.amount, p.currency),
        ])
      : [[{ content: "No line items", colSpan: 4, styles: { textColor: 107 } }]],
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [243, 244, 246], textColor: 17, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
  });

  y = doc.lastAutoTable.finalY + 22;
  const row = (label, value, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(bold ? 12 : 10).setTextColor(17);
    doc.text(label, W - M - 200, y);
    doc.text(value, W - M, y, { align: "right" });
    y += bold ? 18 : 16;
  };
  row("Subtotal", money(p.subtotal, p.currency));
  row(`Tax (${p.taxRate}%)`, money(p.taxTotal, p.currency));
  row("Total due", money(p.total, p.currency), true);

  if (p.note) {
    y += 12;
    if (y > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); y = 56; }
    doc.setFont("helvetica", "bold").setFontSize(10).text("Note", M, y);
    doc.setFont("helvetica", "normal").text(doc.splitTextToSize(p.note, W - M * 2), M, y + 14);
  }
  return doc;
}

/** The PDF file name: Invoice-INV-1004.pdf */
export const invoicePdfName = (inv, opts) => `Invoice-${toPrintable(inv, opts).number || "draft"}.pdf`;

/** Download the invoice as a PDF. */
export async function downloadInvoicePdf(inv, opts) {
  const doc = createInvoicePdf(inv, opts);
  doc.save(invoicePdfName(inv, opts));
  return true;
}