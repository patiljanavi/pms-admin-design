// import { Bell, Mail } from 'lucide-react';
// import { Modal } from './ui';
// import { Button } from './ui/button';
// import { calcTotals, money, paymentLabel, rowAmount } from '../data/invoiceTemplates';

// /** Highlights [SHORTCODES] so the preview shows where real values will go. */
// function WithShortcodes({ text = '' }) {
//   return text.split(/(\[[A-Z0-9_]+\])/g).map((part, i) => (/^\[[A-Z0-9_]+\]$/.test(part)
//     ? <span key={i} className="te-field mx-0.5 inline-flex items-center rounded bg-brand-50 px-1.5 font-mono text-[0.85em] font-medium text-brand-700 ring-1 ring-inset ring-brand-200">{part}</span>
//     : <span key={i}>{part}</span>));
// }

// const Eyebrow = ({ children }) => <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{children}</p>;

// /**
//  * Preview of the invoice a client receives from this template. Props: form · onClose()
//  * The "paper" is a theme-aware card (bg-card) on a quiet backdrop, so it reads as a
//  * document in light mode and stays comfortable to read in dark mode.
//  */
// export default function InvoicePreview({ form, onClose }) {
//   const { subtotal, taxTotal, totalAmount } = calcTotals(form.rows, form.taxRate);
//   const issued = new Date();
//   return (
//     <Modal title="Invoice preview" subtitle={form.templatename || 'Untitled template'} description="What the client receives. Shortcodes are filled in when the invoice is created."
//       onClose={onClose} width="max-w-3xl" bodyClassName="bg-subtle"
//       footer={<Button type="button" onClick={onClose}>Close preview</Button>}>
//       <article aria-label="Invoice" className="mx-auto max-w-[680px] rounded-lg border bg-card p-6 text-card-foreground shadow-raised sm:p-10">
//         <header className="flex flex-wrap items-start justify-between gap-6">
//           <div>
//             <div className="flex items-center gap-2.5">
//               <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground" aria-hidden="true">H</span>
//               <span className="text-lg font-semibold tracking-tight">Harbor Accounting</span>
//             </div>
//             <p className="mt-2 text-sm text-muted-foreground"><WithShortcodes text="[FIRM_EMAIL]" /></p>
//           </div>
//           <div className="text-right">
//             <h3 className="text-2xl font-semibold uppercase tracking-[0.2em] text-muted-foreground">Invoice</h3>
//             <dl className="mt-2 grid grid-cols-[auto_auto] justify-end gap-x-4 gap-y-0.5 text-sm">
//               <dt className="text-muted-foreground">No.</dt><dd className="font-medium tabular-nums">INV-PREVIEW</dd>
//               <dt className="text-muted-foreground">Issued</dt><dd className="font-medium tabular-nums">{issued.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</dd>
//             </dl>
//           </div>
//         </header>

//         <div className="my-8 grid grid-cols-1 gap-6 border-y py-6 sm:grid-cols-2">
//           <div><Eyebrow>Bill to</Eyebrow><p className="mt-1.5 font-medium"><WithShortcodes text="[ACCOUNT_NAME]" /></p></div>
//           <div className="sm:text-right"><Eyebrow>Payment method</Eyebrow><p className="mt-1.5 font-medium">{paymentLabel(form.paymentMode)}</p></div>
//           {form.description && <div className="sm:col-span-2"><Eyebrow>Description</Eyebrow><p className="mt-1.5 text-sm"><WithShortcodes text={form.description} /></p></div>}
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full min-w-[480px] text-sm">
//             <thead>
//               <tr className="border-b-2 border-foreground/80 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
//                 <th className="py-2 pr-3 font-medium">Item</th><th className="px-3 py-2 text-right font-medium">Rate</th><th className="px-3 py-2 text-right font-medium">Qty</th><th className="py-2 pl-3 text-right font-medium">Amount</th>
//               </tr>
//             </thead>
//             <tbody>
//               {form.rows.map((r) => (
//                 <tr key={r.id} className="border-b align-top">
//                   <td className="py-3 pr-3">
//                     <div className="font-medium">{r.productName || 'Untitled item'}{r.tax && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(taxed)</span>}</div>
//                     {r.description && <div className="mt-0.5 text-xs text-muted-foreground">{r.description}</div>}
//                   </td>
//                   <td className="px-3 py-3 text-right tabular-nums">{money(r.rate)}</td>
//                   <td className="px-3 py-3 text-right tabular-nums">{r.qty}</td>
//                   <td className="py-3 pl-3 text-right font-medium tabular-nums">{money(rowAmount(r))}</td>
//                 </tr>
//               ))}
//               {form.rows.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No line items</td></tr>}
//             </tbody>
//           </table>
//         </div>

//         <dl className="ml-auto mt-6 flex max-w-xs flex-col gap-2 text-sm">
//           <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{money(subtotal)}</dd></div>
//           <div className="flex justify-between"><dt className="text-muted-foreground">Tax ({Number(form.taxRate) || 0}%)</dt><dd className="tabular-nums">{money(taxTotal)}</dd></div>
//           <div className="mt-1 flex items-baseline justify-between rounded-md bg-muted px-3 py-2.5">
//             <dt className="font-medium">Total due</dt><dd className="text-lg font-bold tabular-nums" data-testid="preview-total">{money(totalAmount)}</dd>
//           </div>
//           {form.payUsingCredits && <p className="text-xs text-muted-foreground">Available account credits are applied automatically.</p>}
//         </dl>

//         {form.clientNote && (
//           <section className="mt-8 border-t pt-5">
//             <h4 className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Note</h4>
//             {/* The note comes from this app's own text editor */}
//             <div className="te-content text-sm text-muted-foreground [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: form.clientNote }} />
//           </section>
//         )}
//       </article>
//       {(form.emailToClient || form.invoiceReminders) && (
//         <ul className="mx-auto mt-4 flex max-w-[680px] flex-col gap-1.5 text-sm text-muted-foreground">
//           {form.emailToClient && <li className="flex items-center gap-2"><Mail className="size-4 flex-none" aria-hidden="true" />Emailed to the client when the invoice is created.</li>}
//           {form.invoiceReminders && <li className="flex items-center gap-2"><Bell className="size-4 flex-none" aria-hidden="true" />Reminder every {form.daysNextReminder} days, up to {form.numOfReminder} times.</li>}
//         </ul>
//       )}
//     </Modal>
//   );
// }

import { Bell, Mail, Printer } from 'lucide-react';
import { Modal } from './ui';
import { Button } from './ui/button';
import { calcTotals, money, paymentLabel, rowAmount } from '../data/invoiceTemplates';
import { fillShortcodes } from '../data/accountChats';

/** Highlights [SHORTCODES] so the preview shows where real values will go. */
function WithShortcodes({ text = '' }) {
  return text.split(/(\[[A-Z0-9_]+\])/g).map((part, i) => (/^\[[A-Z0-9_]+\]$/.test(part)
    ? <span key={i} className="te-field mx-0.5 inline-flex items-center rounded bg-brand-50 px-1.5 font-mono text-[0.85em] font-medium text-brand-700 ring-1 ring-inset ring-brand-200">{part}</span>
    : <span key={i}>{part}</span>));
}

const Eyebrow = ({ children }) => <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{children}</p>;
const fmtDate = (d) => (d ? new Date(typeof d === 'string' && d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

/**
 * Preview of the invoice a client receives. Props: form · onClose()
 * Used two ways:
 *   • Invoice template preview — <InvoicePreview form={template} onClose />  (shows [SHORTCODES], INV-PREVIEW, today)
 *   • Account invoice preview  — <InvoicePreview form={…} account={account} number="INV-1029" issueDate dueDate onPrint onClose />
 *     (Bill to = the account, shortcodes filled in for it, the real number and dates, and a Print button)
 * form: { templatename?, paymentMode, description, rows, taxRate, payUsingCredits, clientNote, emailToClient, invoiceReminders, daysNextReminder, numOfReminder }
 * The "paper" is a theme-aware card (bg-card) on a quiet backdrop, so it reads as a
 * document in light mode and stays comfortable to read in dark mode.
 */
export default function InvoicePreview({ form, onClose, account = null, number, issueDate, dueDate, onPrint }) {
  const { subtotal, taxTotal, totalAmount } = calcTotals(form.rows, form.taxRate);
  const fill = (text = '') => (account ? fillShortcodes(text, account) : text);
  const contactEmail = account?.contacts?.[0]?.email || account?.email || '';
  const issued = issueDate || new Date();
  return (
    <Modal title="Invoice preview"
      subtitle={account ? `${number || 'New invoice'} · ${account.name}` : (form.templatename || 'Untitled template')}
      description={account ? `What ${account.name} receives.` : 'What the client receives. Shortcodes are filled in when the invoice is created.'}
      onClose={onClose} width="max-w-3xl" bodyClassName="bg-subtle"
      footer={<>
        {onPrint && <Button type="button" variant="outline" onClick={onPrint}><Printer aria-hidden="true" /> Print</Button>}
        <Button type="button" onClick={onClose}>Close preview</Button>
      </>}>
      <article aria-label="Invoice" className="mx-auto max-w-[680px] rounded-lg border bg-card p-6 text-card-foreground shadow-raised sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground" aria-hidden="true">H</span>
              <span className="text-lg font-semibold tracking-tight">Harbor Accounting</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground"><WithShortcodes text="[FIRM_EMAIL]" /></p>
          </div>
          <div className="text-right">
            <h3 className="text-2xl font-semibold uppercase tracking-[0.2em] text-muted-foreground">Invoice</h3>
            <dl className="mt-2 grid grid-cols-[auto_auto] justify-end gap-x-4 gap-y-0.5 text-sm">
              <dt className="text-muted-foreground">No.</dt><dd className="font-medium tabular-nums" data-testid="preview-number">{number || 'INV-PREVIEW'}</dd>
              <dt className="text-muted-foreground">Issued</dt><dd className="font-medium tabular-nums">{fmtDate(issued)}</dd>
              {dueDate && <><dt className="text-muted-foreground">Due</dt><dd className="font-medium tabular-nums">{fmtDate(dueDate)}</dd></>}
            </dl>
          </div>
        </header>

        <div className="my-8 grid grid-cols-1 gap-6 border-y py-6 sm:grid-cols-2">
          <div>
            <Eyebrow>Bill to</Eyebrow>
            {account ? (
              <div className="mt-1.5" data-testid="preview-bill-to">
                <p className="font-medium">{account.name}</p>
                {account.company && <p className="text-sm text-muted-foreground">{account.company}</p>}
                {contactEmail && <p className="text-sm text-muted-foreground">{contactEmail}</p>}
              </div>
            ) : <p className="mt-1.5 font-medium"><WithShortcodes text="[ACCOUNT_NAME]" /></p>}
          </div>
          <div className="sm:text-right"><Eyebrow>Payment method</Eyebrow><p className="mt-1.5 font-medium">{paymentLabel(form.paymentMode)}</p></div>
          {form.description && <div className="sm:col-span-2"><Eyebrow>Description</Eyebrow><p className="mt-1.5 text-sm"><WithShortcodes text={fill(form.description)} /></p></div>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm" aria-label="Line items">
            <thead>
              <tr className="border-b-2 border-foreground/80 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Item</th><th className="px-3 py-2 text-right font-medium">Rate</th><th className="px-3 py-2 text-right font-medium">Qty</th><th className="py-2 pl-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(form.rows || []).map((r) => (
                <tr key={r.id} className="border-b align-top">
                  <td className="py-3 pr-3">
                    <div className="font-medium">{r.productName || 'Untitled item'}{r.tax && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(taxed)</span>}</div>
                    {r.description && <div className="mt-0.5 text-xs text-muted-foreground">{r.description}</div>}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{money(r.rate)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{r.qty}</td>
                  <td className="py-3 pl-3 text-right font-medium tabular-nums">{money(rowAmount(r))}</td>
                </tr>
              ))}
              {(form.rows || []).length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No line items</td></tr>}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-6 flex max-w-xs flex-col gap-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{money(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Tax ({Number(form.taxRate) || 0}%)</dt><dd className="tabular-nums">{money(taxTotal)}</dd></div>
          <div className="mt-1 flex items-baseline justify-between rounded-md bg-muted px-3 py-2.5">
            <dt className="font-medium">Total due</dt><dd className="text-lg font-bold tabular-nums" data-testid="preview-total">{money(totalAmount)}</dd>
          </div>
          {form.payUsingCredits && <p className="text-xs text-muted-foreground">Available account credits are applied automatically.</p>}
        </dl>

        {form.clientNote && (
          <section className="mt-8 border-t pt-5">
            <h4 className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Note</h4>
            {/* The note comes from this app's own text editor */}
            <div className="te-content text-sm text-muted-foreground [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: fill(form.clientNote) }} />
          </section>
        )}
      </article>
      {(form.emailToClient || form.invoiceReminders) && (
        <ul className="mx-auto mt-4 flex max-w-[680px] flex-col gap-1.5 text-sm text-muted-foreground">
          {form.emailToClient && <li className="flex items-center gap-2"><Mail className="size-4 flex-none" aria-hidden="true" />Emailed to the client when the invoice is {account ? 'saved' : 'created'}.</li>}
          {form.invoiceReminders && <li className="flex items-center gap-2"><Bell className="size-4 flex-none" aria-hidden="true" />Reminder every {form.daysNextReminder} days, up to {form.numOfReminder} times.</li>}
        </ul>
      )}
    </Modal>
  );
}