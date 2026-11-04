// // import { useEffect, useMemo, useState } from 'react';
// // import { Link, useNavigate, useParams } from 'react-router-dom';
// // import { FiArrowLeft, FiBell, FiEye, FiFileText, FiTrash2 } from 'react-icons/fi';
// // import ShortcodeTextField from '../../../components/ShortcodeTextField';
// // import TextEditor from '../../../components/TextEditor';
// // import InvoicePreview from '../../../components/InvoicePreview';
// // import LineItemsAndSummary from '../../../components/LineItemsAndSummary';
// // import { Modal, Toggle, cx } from '../../../components/ui';
// // import { useData } from '../../../context/DataContext';
// // import { accountShortcuts, contactShortcuts } from '../../../data/shortcodes';
// // import { PAYMENT_OPTIONS, emptyInvoiceTemplate, newRow } from '../../../data/invoiceTemplates';

// // const LIST_PATH = '/firmtemp/templates/invoices';
// // const clone = (o) => JSON.parse(JSON.stringify(o));
// // const textOf = (v) => (v && typeof v === 'object' && v.target ? v.target.value : v ?? '');

// // function Section({ title, icon, children }) {
// //   return (
// //     <section className="card p-5 sm:p-6">
// //       {title && <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">{icon}{title}</h2>}
// //       <div className="flex flex-col gap-4">{children}</div>
// //     </section>
// //   );
// // }
// // function SwitchRow({ label, checked, onChange }) {
// //   return (
// //     <div className="flex items-center justify-between gap-4 rounded-md border border-line p-3.5">
// //       <span className="text-sm font-semibold">{label}</span>
// //       <Toggle label={label} checked={checked} onChange={onChange} />
// //     </div>
// //   );
// // }

// // /**
// //  * Create / edit an invoice template (same pattern as the task, email, job and chat forms).
// //  *   /firmtemp/templates/invoices/new          → create
// //  *   /firmtemp/templates/invoices/:templateId  → edit
// //  */
// // export default function InvoiceTemplateForm() {
// //   const { templateId } = useParams();
// //   return <FormPage key={templateId || 'new'} editingId={templateId} />;
// // }

// // function FormPage({ editingId }) {
// //   const navigate = useNavigate();
// //   const { invoiceTemplates = [], saveInvoiceTemplate, deleteInvoiceTemplates, invoiceTemplateNameTaken } = useData();
// //   const existing = editingId ? invoiceTemplates.find((t) => String(t.id) === String(editingId)) : null;
// //   const isEditMode = !!editingId;

// //   const initial = useMemo(() => ({ ...clone(emptyInvoiceTemplate), rows: [newRow()], ...clone(existing || {}) }), []); // eslint-disable-line react-hooks/exhaustive-deps
// //   const [formData, setFormData] = useState(initial);
// //   const [saved, setSaved] = useState(initial);
// //   const [errors, setErrors] = useState({});
// //   const [modal, setModal] = useState(null);   // 'discard' | 'delete' | 'preview'
// //   const [toast, setToast] = useState('');
// //   const dirty = JSON.stringify(formData) !== JSON.stringify(saved);
// //   const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
// //   const set = (k, v) => { const value = textOf(v); setFormData((f) => ({ ...f, [k]: value })); setErrors((e) => ({ ...e, [k]: undefined })); };

// //   useEffect(() => {
// //     if (!dirty) return undefined;
// //     const h = (e) => { e.preventDefault(); e.returnValue = ''; };
// //     window.addEventListener('beforeunload', h);
// //     return () => window.removeEventListener('beforeunload', h);
// //   }, [dirty]);

// //   if (!saveInvoiceTemplate) return <div role="alert" className="card bg-danger-50 p-6 font-semibold text-danger-700">Invoice templates are not set up in DataContext.js</div>;
// //   if (editingId && !existing) {
// //     return (
// //       <div className="flex flex-col items-start gap-4">
// //         <h1 className="text-3xl font-bold">Invoice template not found</h1>
// //         <Link to={LIST_PATH} className="btn-primary">Back to invoice templates</Link>
// //       </div>
// //     );
// //   }

// //   const validate = () => {
// //     const e = {};
// //     const name = formData.templatename.trim();
// //     if (!name) e.templatename = 'Template name is required.';
// //     else if (invoiceTemplateNameTaken?.(name, editingId)) e.templatename = 'Another invoice template already has this name.';
// //     if (!formData.rows.length) e.rows = 'Add at least one line item.';
// //     else if (formData.rows.some((r) => !r.productName.trim())) e.rows = 'Every line item needs a name.';
// //     else if (formData.rows.some((r) => !(Number(r.qty) > 0) || !(Number(r.rate) >= 0) || r.rate === '')) e.rows = 'Check the rate and quantity of every line item.';
// //     if (formData.emailToClient && !formData.clientmsg.trim()) e.clientmsg = 'Write the email message, or turn off the email.';
// //     if (formData.invoiceReminders) {
// //       if (!(Number(formData.daysNextReminder) >= 1)) e.daysNextReminder = 'Enter at least 1 day.';
// //       if (!(Number(formData.numOfReminder) >= 1)) e.numOfReminder = 'Enter at least 1 reminder.';
// //     }
// //     if (!(Number(formData.taxRate) >= 0 && Number(formData.taxRate) <= 100)) e.rows = 'Tax rate must be between 0 and 100.';
// //     setErrors(e);
// //     if (Object.keys(e).length) window.scrollTo?.({ top: 0, behavior: 'smooth' });
// //     return Object.keys(e).length === 0;
// //   };
// //   const persist = () => {
// //     const data = {
// //       ...formData, id: editingId || undefined, templatename: formData.templatename.trim(),
// //       taxRate: Number(formData.taxRate) || 0, daysNextReminder: Number(formData.daysNextReminder) || 0, numOfReminder: Number(formData.numOfReminder) || 0,
// //       rows: formData.rows.map((r) => ({ ...r, productName: r.productName.trim(), rate: Number(r.rate) || 0, qty: Number(r.qty) || 0 })),
// //     };
// //     const id = saveInvoiceTemplate(data);
// //     return { ...data, id };
// //   };
// //   const onSave = () => {
// //     if (!validate()) return;
// //     const data = persist();
// //     setFormData(data); setSaved(data);
// //     notify(isEditMode ? `Updated “${data.templatename}”` : `Saved “${data.templatename}”`);
// //     if (!editingId) navigate(`${LIST_PATH}/${data.id}`, { replace: true });
// //   };
// //   const onSaveAndExit = () => {
// //     if (!validate()) return;
// //     const data = persist();
// //     navigate(LIST_PATH, { state: { toast: isEditMode ? `Updated “${data.templatename}”` : `Created “${data.templatename}”` } });
// //   };
// //   const onCancel = () => (dirty ? setModal('discard') : navigate(LIST_PATH));

// //   return (
// //     <div className="flex flex-col gap-6">
// //       {/* Header */}
// //       <header className="flex flex-wrap items-center gap-4">
// //         <button onClick={onCancel} aria-label="Back to invoice templates" className="flex h-10 w-10 items-center justify-center rounded border border-line-strong bg-surface hover:bg-subtle"><FiArrowLeft size={18} /></button>
// //         <div className="min-w-0 flex-1">
// //           <nav aria-label="Breadcrumb" className="text-sm text-muted">
// //             <Link to="/firmtemp/templates" className="hover:underline">Firm Templates</Link> / <Link to={LIST_PATH} className="hover:underline">Invoices</Link>
// //           </nav>
// //           <h1 className="flex items-center gap-2 truncate text-2xl font-bold sm:text-3xl"><FiFileText className="text-brand-600" aria-hidden="true" />{isEditMode ? 'Edit Invoice Template' : 'Create Invoice Template'}</h1>
// //           <p className="text-muted">Configure your invoice template settings</p>
// //         </div>
// //         <div className="flex flex-wrap items-center gap-2">
// //           <button type="button" onClick={() => setModal('preview')} className="btn-link flex items-center gap-1.5 px-2 text-sm"><FiEye aria-hidden="true" /> Preview</button>
// //           {isEditMode && <button type="button" className="btn border border-danger-200 bg-surface text-danger-700 hover:bg-danger-50" onClick={() => setModal('delete')}><FiTrash2 aria-hidden="true" /> Delete</button>}
// //           <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
// //           <button type="button" className="btn border border-brand-600 bg-brand-50 text-brand-600 hover:bg-brand-100" onClick={onSave}>{isEditMode ? 'Update' : 'Save'}</button>
// //           <button type="button" className="btn-primary" onClick={onSaveAndExit}>{isEditMode ? 'Update & Exit' : 'Save & Exit'}</button>
// //         </div>
// //       </header>

// //       {dirty && <div className="rounded-md border border-warning-300 bg-warning-50 px-4 py-2.5 text-sm font-semibold text-warning-700">You have unsaved changes.</div>}
// //       {Object.values(errors).some(Boolean) && <div role="alert" className="rounded-md bg-danger-50 px-4 py-3 font-semibold text-danger-700">Please fix the highlighted fields.</div>}

// //       <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
// //         {/* LEFT COLUMN: Invoice settings */}
// //         <div className="flex flex-col gap-6">
// //           <Section title="General" icon={<FiFileText aria-hidden="true" />}>
// //             <label className="field-label">
// //               <span>Template Name <span className="text-danger-700">*</span></span>
// //               <input name="TemplateName" className={cx('input', errors.templatename && 'border-danger-700')} value={formData.templatename} onChange={(e) => set('templatename', e.target.value)} placeholder="Template Name" />
// //               {errors.templatename && <span className="text-sm font-normal text-danger-700">{errors.templatename}</span>}
// //             </label>
// //             <ShortcodeTextField label="Description" value={formData.description} onChange={(v) => set('description', v)} placeholder="Description"
// //               multiline rows={3} maxLength={50000} shortcuts={accountShortcuts} />
// //             <label className="field-label">Choose payment method
// //               <select className="input" value={formData.paymentMode?.value || ''} onChange={(e) => set('paymentMode', PAYMENT_OPTIONS.find((o) => o.value === e.target.value) || null)}>
// //                 <option value="">Select Payment Mode</option>
// //                 {PAYMENT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
// //               </select>
// //             </label>
// //           </Section>

// //           <Section title="Email & Reminders" icon={<FiBell aria-hidden="true" />}>
// //             <SwitchRow label="Send email to client when invoice created" checked={!!formData.emailToClient} onChange={(v) => set('emailToClient', v)} />
// //             {formData.emailToClient && (
// //               <ShortcodeTextField label="Email Message to Client" value={formData.clientmsg} onChange={(v) => set('clientmsg', v)}
// //                 placeholder="Enter email message to client..." multiline rows={3} shortcuts={contactShortcuts} error={errors.clientmsg} />
// //             )}
// //             <SwitchRow label="Pay invoice with credits if available" checked={!!formData.payUsingCredits} onChange={(v) => set('payUsingCredits', v)} />
// //             <SwitchRow label="Send Reminders to clients" checked={!!formData.invoiceReminders} onChange={(v) => set('invoiceReminders', v)} />
// //             {formData.invoiceReminders && (
// //               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
// //                 <label className="field-label">Days until next reminder
// //                   <input type="number" min="1" className={cx('input', errors.daysNextReminder && 'border-danger-700')} placeholder="Days until next reminder" value={formData.daysNextReminder} onChange={(e) => set('daysNextReminder', e.target.value)} />
// //                   {errors.daysNextReminder && <span className="text-sm font-normal text-danger-700">{errors.daysNextReminder}</span>}
// //                 </label>
// //                 <label className="field-label">Number of reminders
// //                   <input type="number" min="1" className={cx('input', errors.numOfReminder && 'border-danger-700')} placeholder="Number of reminders" value={formData.numOfReminder} onChange={(e) => set('numOfReminder', e.target.value)} />
// //                   {errors.numOfReminder && <span className="text-sm font-normal text-danger-700">{errors.numOfReminder}</span>}
// //                 </label>
// //               </div>
// //             )}
// //           </Section>
// //         </div>

// //         {/* RIGHT COLUMN: Line items + note */}
// //         <aside className="flex flex-col gap-6">
// //           <Section>
// //             <LineItemsAndSummary rows={formData.rows} onChange={(rows) => { setFormData((f) => ({ ...f, rows })); setErrors((e) => ({ ...e, rows: undefined })); }}
// //               taxRate={formData.taxRate} onTaxRateChange={(v) => set('taxRate', v)} error={errors.rows} />
// //           </Section>
// //           <Section title="Note to Client">
// //             <TextEditor ariaLabel="Note to client" value={formData.clientNote} onChange={(html) => set('clientNote', html)} shortcuts={contactShortcuts} placeholder="Shown at the bottom of the invoice" minHeight={140} />
// //           </Section>
// //         </aside>
// //       </div>

// //       {modal === 'preview' && <InvoicePreview form={formData} onClose={() => setModal(null)} />}
// //       {modal === 'discard' && (
// //         <Modal title="Discard changes?" onClose={() => setModal(null)}
// //           footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Keep editing</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => navigate(LIST_PATH)}>Discard</button></>}>
// //           <p className="text-muted">Your changes to this invoice template haven't been saved.</p>
// //         </Modal>
// //       )}
// //       {modal === 'delete' && (
// //         <Modal title={`Delete “${saved.templatename}”?`} onClose={() => setModal(null)}
// //           footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { deleteInvoiceTemplates([editingId]); navigate(LIST_PATH, { state: { toast: `Deleted “${saved.templatename}”` } }); }}>Delete</button></>}>
// //           <p className="text-muted">Invoices already created from this template are not affected.</p>
// //         </Modal>
// //       )}
// //       {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
// //     </div>
// //   );
// // }


// import { useEffect, useMemo, useState } from 'react';
// import { Link, useNavigate, useParams } from 'react-router-dom';
// import { FiArrowLeft, FiBell, FiEye, FiFileText, FiTrash2 } from 'react-icons/fi';
// import ShortcodeTextField from '../../../components/ShortcodeTextField';
// import TextEditor from '../../../components/TextEditor';
// import InvoicePreview from '../../../components/InvoicePreview';
// import LineItemsAndSummary from '../../../components/LineItemsAndSummary';
// import { Modal, Toggle, cx } from '../../../components/ui';
// import { useData } from '../../../context/DataContext';
// import { accountShortcuts, contactShortcuts } from '../../../data/shortcodes';
// import { PAYMENT_OPTIONS, emptyInvoiceTemplate, newRow } from '../../../data/invoiceTemplates';

// const LIST_PATH = '/firmtemp/templates/invoices';
// const clone = (o) => JSON.parse(JSON.stringify(o));
// const textOf = (v) => (v && typeof v === 'object' && v.target ? v.target.value : v ?? '');

// function Section({ title, icon, children }) {
//   return (
//     <section className="card p-5 sm:p-6">
//       {title && <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">{icon}{title}</h2>}
//       <div className="flex flex-col gap-4">{children}</div>
//     </section>
//   );
// }
// function SwitchRow({ label, checked, onChange }) {
//   return (
//     <div className="flex items-center justify-between gap-4 rounded-md border border-line p-3.5">
//       <span className="text-sm font-semibold">{label}</span>
//       <Toggle label={label} checked={checked} onChange={onChange} />
//     </div>
//   );
// }

// /**
//  * Create / edit an invoice template (same pattern as the task, email, job and chat forms).
//  *   /firmtemp/templates/invoices/new          → create
//  *   /firmtemp/templates/invoices/:templateId  → edit
//  */
// export default function InvoiceTemplateForm() {
//   const { templateId } = useParams();
//   return <FormPage key={templateId || 'new'} editingId={templateId} />;
// }

// function FormPage({ editingId }) {
//   const navigate = useNavigate();
//   const { invoiceTemplates = [], saveInvoiceTemplate, deleteInvoiceTemplates, invoiceTemplateNameTaken } = useData();
//   const existing = editingId ? invoiceTemplates.find((t) => String(t.id) === String(editingId)) : null;
//   const isEditMode = !!editingId;

//   const initial = useMemo(() => ({ ...clone(emptyInvoiceTemplate), rows: [newRow()], ...clone(existing || {}) }), []); // eslint-disable-line react-hooks/exhaustive-deps
//   const [formData, setFormData] = useState(initial);
//   const [saved, setSaved] = useState(initial);
//   const [errors, setErrors] = useState({});
//   const [modal, setModal] = useState(null);   // 'discard' | 'delete' | 'preview'
//   const [toast, setToast] = useState('');
//   const dirty = JSON.stringify(formData) !== JSON.stringify(saved);
//   const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
//   const set = (k, v) => { const value = textOf(v); setFormData((f) => ({ ...f, [k]: value })); setErrors((e) => ({ ...e, [k]: undefined })); };

//   useEffect(() => {
//     if (!dirty) return undefined;
//     const h = (e) => { e.preventDefault(); e.returnValue = ''; };
//     window.addEventListener('beforeunload', h);
//     return () => window.removeEventListener('beforeunload', h);
//   }, [dirty]);

//   if (!saveInvoiceTemplate) return <div role="alert" className="card bg-danger-50 p-6 font-semibold text-danger-700">Invoice templates are not set up in DataContext.js</div>;
//   if (editingId && !existing) {
//     return (
//       <div className="flex flex-col items-start gap-4">
//         <h1 className="text-3xl font-bold">Invoice template not found</h1>
//         <Link to={LIST_PATH} className="btn-primary">Back to invoice templates</Link>
//       </div>
//     );
//   }

//   const validate = () => {
//     const e = {};
//     const name = formData.templatename.trim();
//     if (!name) e.templatename = 'Template name is required.';
//     else if (invoiceTemplateNameTaken?.(name, editingId)) e.templatename = 'Another invoice template already has this name.';
//     if (!formData.rows.length) e.rows = 'Add at least one line item.';
//     else if (formData.rows.some((r) => !r.productName.trim())) e.rows = 'Every line item needs a name.';
//     else if (formData.rows.some((r) => !(Number(r.qty) > 0) || !(Number(r.rate) >= 0) || r.rate === '')) e.rows = 'Check the rate and quantity of every line item.';
//     if (formData.emailToClient && !formData.clientmsg.trim()) e.clientmsg = 'Write the email message, or turn off the email.';
//     if (formData.invoiceReminders) {
//       if (!(Number(formData.daysNextReminder) >= 1)) e.daysNextReminder = 'Enter at least 1 day.';
//       if (!(Number(formData.numOfReminder) >= 1)) e.numOfReminder = 'Enter at least 1 reminder.';
//     }
//     if (!(Number(formData.taxRate) >= 0 && Number(formData.taxRate) <= 100)) e.rows = 'Tax rate must be between 0 and 100.';
//     setErrors(e);
//     if (Object.keys(e).length) window.scrollTo?.({ top: 0, behavior: 'smooth' });
//     return Object.keys(e).length === 0;
//   };
//   const persist = () => {
//     const data = {
//       ...formData, id: editingId || undefined, templatename: formData.templatename.trim(),
//       taxRate: Number(formData.taxRate) || 0, daysNextReminder: Number(formData.daysNextReminder) || 0, numOfReminder: Number(formData.numOfReminder) || 0,
//       rows: formData.rows.map((r) => ({ ...r, productName: r.productName.trim(), rate: Number(r.rate) || 0, qty: Number(r.qty) || 0 })),
//     };
//     const id = saveInvoiceTemplate(data);
//     return { ...data, id };
//   };
//   const onSave = () => {
//     if (!validate()) return;
//     const data = persist();
//     setFormData(data); setSaved(data);
//     notify(isEditMode ? `Updated “${data.templatename}”` : `Saved “${data.templatename}”`);
//     if (!editingId) navigate(`${LIST_PATH}/${data.id}`, { replace: true });
//   };
//   const onSaveAndExit = () => {
//     if (!validate()) return;
//     const data = persist();
//     navigate(LIST_PATH, { state: { toast: isEditMode ? `Updated “${data.templatename}”` : `Created “${data.templatename}”` } });
//   };
//   const onCancel = () => (dirty ? setModal('discard') : navigate(LIST_PATH));

//   return (
//     <div className="flex flex-col gap-6">
//       {/* Header */}
//       <header className="flex flex-wrap items-center gap-4">
//         <button onClick={onCancel} aria-label="Back to invoice templates" className="flex h-10 w-10 items-center justify-center rounded border border-line-strong bg-surface hover:bg-subtle"><FiArrowLeft size={18} /></button>
//         <div className="min-w-0 flex-1">
//           <nav aria-label="Breadcrumb" className="text-sm text-muted">
//             <Link to="/firmtemp/templates" className="hover:underline">Firm Templates</Link> / <Link to={LIST_PATH} className="hover:underline">Invoices</Link>
//           </nav>
//           <h1 className="flex items-center gap-2 truncate text-2xl font-bold sm:text-3xl"><FiFileText className="text-brand-600" aria-hidden="true" />{isEditMode ? 'Edit Invoice Template' : 'Create Invoice Template'}</h1>
//           <p className="text-muted">Configure your invoice template settings</p>
//         </div>
//         <div className="flex flex-wrap items-center gap-2">
//           <button type="button" onClick={() => setModal('preview')} className="btn-link flex items-center gap-1.5 px-2 text-sm"><FiEye aria-hidden="true" /> Preview</button>
//           {isEditMode && <button type="button" className="btn border border-danger-200 bg-surface text-danger-700 hover:bg-danger-50" onClick={() => setModal('delete')}><FiTrash2 aria-hidden="true" /> Delete</button>}
//           <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
//           <button type="button" className="btn border border-brand-600 bg-brand-50 text-brand-600 hover:bg-brand-100" onClick={onSave}>{isEditMode ? 'Update' : 'Save'}</button>
//           <button type="button" className="btn-primary" onClick={onSaveAndExit}>{isEditMode ? 'Update & Exit' : 'Save & Exit'}</button>
//         </div>
//       </header>

//       {dirty && <div className="rounded-md border border-warning-300 bg-warning-50 px-4 py-2.5 text-sm font-semibold text-warning-700">You have unsaved changes.</div>}
//       {Object.values(errors).some(Boolean) && <div role="alert" className="rounded-md bg-danger-50 px-4 py-3 font-semibold text-danger-700">Please fix the highlighted fields.</div>}

//       <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
//         {/* LEFT COLUMN: Invoice settings */}
//         <div className="flex flex-col gap-6">
//           <Section title="General" icon={<FiFileText aria-hidden="true" />}>
//             <label className="field-label">
//               <span>Template Name <span className="text-danger-700">*</span></span>
//               <input name="TemplateName" className={cx('input', errors.templatename && 'border-danger-700')} value={formData.templatename} onChange={(e) => set('templatename', e.target.value)} placeholder="Template Name" />
//               {errors.templatename && <span className="text-sm font-normal text-danger-700">{errors.templatename}</span>}
//             </label>
//             <ShortcodeTextField label="Description" value={formData.description} onChange={(v) => set('description', v)} placeholder="Description"
//               multiline rows={3} maxLength={50000} shortcuts={accountShortcuts} />
//             <label className="field-label">Choose payment method
//               <select className="input" value={formData.paymentMode?.value || ''} onChange={(e) => set('paymentMode', PAYMENT_OPTIONS.find((o) => o.value === e.target.value) || null)}>
//                 <option value="">Select Payment Mode</option>
//                 {PAYMENT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
//               </select>
//             </label>
//           </Section>

//           <Section title="Email & Reminders" icon={<FiBell aria-hidden="true" />}>
//             <SwitchRow label="Send email to client when invoice created" checked={!!formData.emailToClient} onChange={(v) => set('emailToClient', v)} />
//             {formData.emailToClient && (
//               <ShortcodeTextField label="Email Message to Client" value={formData.clientmsg} onChange={(v) => set('clientmsg', v)}
//                 placeholder="Enter email message to client..." multiline rows={3} shortcuts={contactShortcuts} error={errors.clientmsg} />
//             )}
//             <SwitchRow label="Pay invoice with credits if available" checked={!!formData.payUsingCredits} onChange={(v) => set('payUsingCredits', v)} />
//             <SwitchRow label="Send Reminders to clients" checked={!!formData.invoiceReminders} onChange={(v) => set('invoiceReminders', v)} />
//             {formData.invoiceReminders && (
//               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                 <label className="field-label">Days until next reminder
//                   <input type="number" min="1" className={cx('input', errors.daysNextReminder && 'border-danger-700')} placeholder="Days until next reminder" value={formData.daysNextReminder} onChange={(e) => set('daysNextReminder', e.target.value)} />
//                   {errors.daysNextReminder && <span className="text-sm font-normal text-danger-700">{errors.daysNextReminder}</span>}
//                 </label>
//                 <label className="field-label">Number of reminders
//                   <input type="number" min="1" className={cx('input', errors.numOfReminder && 'border-danger-700')} placeholder="Number of reminders" value={formData.numOfReminder} onChange={(e) => set('numOfReminder', e.target.value)} />
//                   {errors.numOfReminder && <span className="text-sm font-normal text-danger-700">{errors.numOfReminder}</span>}
//                 </label>
//               </div>
//             )}
//           </Section>
//         </div>

//         {/* RIGHT COLUMN: Note to client */}
//         <aside className="flex flex-col gap-6">
//           <Section title="Note to Client">
//             <TextEditor ariaLabel="Note to client" value={formData.clientNote} onChange={(html) => set('clientNote', html)} shortcuts={contactShortcuts} placeholder="Shown at the bottom of the invoice" minHeight={140} />
//           </Section>
//         </aside>
//       </div>

//       {/* Line items: full width (table) */}
//       <Section>
//         <LineItemsAndSummary rows={formData.rows} onChange={(rows) => { setFormData((f) => ({ ...f, rows })); setErrors((e) => ({ ...e, rows: undefined })); }}
//           taxRate={formData.taxRate} onTaxRateChange={(v) => set('taxRate', v)} error={errors.rows} />
//       </Section>

//       {modal === 'preview' && <InvoicePreview form={formData} onClose={() => setModal(null)} />}
//       {modal === 'discard' && (
//         <Modal title="Discard changes?" onClose={() => setModal(null)}
//           footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Keep editing</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => navigate(LIST_PATH)}>Discard</button></>}>
//           <p className="text-muted">Your changes to this invoice template haven't been saved.</p>
//         </Modal>
//       )}
//       {modal === 'delete' && (
//         <Modal title={`Delete “${saved.templatename}”?`} onClose={() => setModal(null)}
//           footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { deleteInvoiceTemplates([editingId]); navigate(LIST_PATH, { state: { toast: `Deleted “${saved.templatename}”` } }); }}>Delete</button></>}>
//           <p className="text-muted">Invoices already created from this template are not affected.</p>
//         </Modal>
//       )}
//       {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
//     </div>
//   );
// }

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiBell, FiEye, FiFileText, FiTrash2 } from 'react-icons/fi';
import ShortcodeTextField from '../../../components/ShortcodeTextField';
import TextEditor from '../../../components/TextEditor';
import InvoicePreview from '../../../components/InvoicePreview';
import LineItemsAndSummary from '../../../components/LineItemsAndSummary';
import { Modal, Toggle, cx } from '../../../components/ui';
import { useData } from '../../../context/DataContext';
import { accountShortcuts, contactShortcuts } from '../../../data/shortcodes';
import { PAYMENT_OPTIONS, calcTotals, emptyInvoiceTemplate, money, newRow, paymentLabel } from '../../../data/invoiceTemplates';

const LIST_PATH = '/firmtemp/templates/invoices';
const clone = (o) => JSON.parse(JSON.stringify(o));
const textOf = (v) => (v && typeof v === 'object' && v.target ? v.target.value : v ?? '');

/** Card with a header (optional step number / icon, title, description) and a body. */
function Section({ step, icon, title, description, action, children, bodyClass = 'p-5 sm:p-6' }) {
  return (
    <section className="card overflow-hidden" aria-labelledby={title ? `sec-${title.replace(/\W+/g, '-')}` : undefined}>
      {title && (
        <header className="flex items-start gap-3 border-b border-line bg-subtle/60 px-5 py-4 sm:px-6">
          {step ? <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white" aria-hidden="true">{step}</span>
            : icon ? <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-100 text-brand-600" aria-hidden="true">{icon}</span> : null}
          <div className="min-w-0 flex-1">
            <h2 id={`sec-${title.replace(/\W+/g, '-')}`} className="font-semibold leading-7">{title}</h2>
            {description && <p className="text-sm text-muted">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

/** A setting with a switch; its extra fields (children) are indented under it when it's on. */
function ToggleSetting({ label, description, checked, onChange, children }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{label}</div>
          {description && <div className="text-xs text-muted">{description}</div>}
        </div>
        <Toggle label={label} checked={checked} onChange={onChange} />
      </div>
      {checked && children && <div className="mt-3 border-l-2 border-brand-100 pl-4">{children}</div>}
    </div>
  );
}

/** Small label / value row for the "At a glance" card. */
const Glance = ({ label, children }) => (
  <div className="flex items-center justify-between gap-3 py-2 text-sm"><dt className="text-muted">{label}</dt><dd className="text-right font-semibold">{children}</dd></div>
);

/**
 * Create / edit an invoice template (same pattern as the task, email, job and chat forms).
 *   /firmtemp/templates/invoices/new          → create
 *   /firmtemp/templates/invoices/:templateId  → edit
 */
export default function InvoiceTemplateForm() {
  const { templateId } = useParams();
  return <FormPage key={templateId || 'new'} editingId={templateId} />;
}

function FormPage({ editingId }) {
  const navigate = useNavigate();
  const { invoiceTemplates = [], saveInvoiceTemplate, deleteInvoiceTemplates, invoiceTemplateNameTaken } = useData();
  const existing = editingId ? invoiceTemplates.find((t) => String(t.id) === String(editingId)) : null;
  const isEditMode = !!editingId;

  const initial = useMemo(() => ({ ...clone(emptyInvoiceTemplate), rows: [newRow()], ...clone(existing || {}) }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [formData, setFormData] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState({});
  const [modal, setModal] = useState(null);   // 'discard' | 'delete' | 'preview'
  const [toast, setToast] = useState('');
  const dirty = JSON.stringify(formData) !== JSON.stringify(saved);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const set = (k, v) => { const value = textOf(v); setFormData((f) => ({ ...f, [k]: value })); setErrors((e) => ({ ...e, [k]: undefined })); };

  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!saveInvoiceTemplate) return <div role="alert" className="card bg-danger-50 p-6 font-semibold text-danger-700">Invoice templates are not set up in DataContext.js</div>;
  if (editingId && !existing) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-3xl font-bold">Invoice template not found</h1>
        <Link to={LIST_PATH} className="btn-primary">Back to invoice templates</Link>
      </div>
    );
  }

  const validate = () => {
    const e = {};
    const name = formData.templatename.trim();
    if (!name) e.templatename = 'Template name is required.';
    else if (invoiceTemplateNameTaken?.(name, editingId)) e.templatename = 'Another invoice template already has this name.';
    if (!formData.rows.length) e.rows = 'Add at least one line item.';
    else if (formData.rows.some((r) => !r.productName.trim())) e.rows = 'Every line item needs a name.';
    else if (formData.rows.some((r) => !(Number(r.qty) > 0) || !(Number(r.rate) >= 0) || r.rate === '')) e.rows = 'Check the rate and quantity of every line item.';
    if (formData.emailToClient && !formData.clientmsg.trim()) e.clientmsg = 'Write the email message, or turn off the email.';
    if (formData.invoiceReminders) {
      if (!(Number(formData.daysNextReminder) >= 1)) e.daysNextReminder = 'Enter at least 1 day.';
      if (!(Number(formData.numOfReminder) >= 1)) e.numOfReminder = 'Enter at least 1 reminder.';
    }
    if (!(Number(formData.taxRate) >= 0 && Number(formData.taxRate) <= 100)) e.rows = 'Tax rate must be between 0 and 100.';
    setErrors(e);
    if (Object.keys(e).length) window.scrollTo?.({ top: 0, behavior: 'smooth' });
    return Object.keys(e).length === 0;
  };
  const persist = () => {
    const data = {
      ...formData, id: editingId || undefined, templatename: formData.templatename.trim(),
      taxRate: Number(formData.taxRate) || 0, daysNextReminder: Number(formData.daysNextReminder) || 0, numOfReminder: Number(formData.numOfReminder) || 0,
      rows: formData.rows.map((r) => ({ ...r, productName: r.productName.trim(), rate: Number(r.rate) || 0, qty: Number(r.qty) || 0 })),
    };
    const id = saveInvoiceTemplate(data);
    return { ...data, id };
  };
  const onSave = () => {
    if (!validate()) return;
    const data = persist();
    setFormData(data); setSaved(data);
    notify(isEditMode ? `Updated “${data.templatename}”` : `Saved “${data.templatename}”`);
    if (!editingId) navigate(`${LIST_PATH}/${data.id}`, { replace: true });
  };
  const onSaveAndExit = () => {
    if (!validate()) return;
    const data = persist();
    navigate(LIST_PATH, { state: { toast: isEditMode ? `Updated “${data.templatename}”` : `Created “${data.templatename}”` } });
  };
  const onCancel = () => (dirty ? setModal('discard') : navigate(LIST_PATH));

  const { totalAmount } = calcTotals(formData.rows, formData.taxRate);
  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6 pb-2">
      {/* ===== Header ===== */}
      <header className="flex flex-wrap items-start gap-4">
        <button onClick={onCancel} aria-label="Back to invoice templates" className="mt-1 flex h-10 w-10 flex-none items-center justify-center rounded border border-line-strong bg-surface hover:bg-subtle"><FiArrowLeft size={18} /></button>
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link to="/firmtemp/templates" className="hover:underline">Firm Templates</Link> <span aria-hidden="true">/</span> <Link to={LIST_PATH} className="hover:underline">Invoices</Link>
          </nav>
          <h1 className="truncate text-2xl font-bold sm:text-3xl">{isEditMode ? 'Edit Invoice Template' : 'Create Invoice Template'}</h1>
          <p className="text-muted">Configure your invoice template settings</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setModal('preview')} className="btn-secondary"><FiEye aria-hidden="true" /> Preview</button>
          {isEditMode && <button type="button" className="btn border border-danger-200 bg-surface text-danger-700 hover:bg-danger-50" onClick={() => setModal('delete')}><FiTrash2 aria-hidden="true" /> Delete</button>}
        </div>
      </header>

      {errorCount > 0 && (
        <div role="alert" className="flex items-center gap-3 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-danger-700">
          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-danger-700 text-xs font-bold text-white">{errorCount}</span>
          <span className="font-semibold">Please fix the highlighted fields.</span>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ===== MAIN: the invoice itself ===== */}
        <div className="flex min-w-0 flex-col gap-6">
          <Section step={1} title="Template details" description="How this template is named and paid">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="field-label">
                <span>Template Name <span className="text-danger-700">*</span></span>
                <input name="TemplateName" className={cx('input', errors.templatename && 'border-danger-700')} value={formData.templatename} onChange={(e) => set('templatename', e.target.value)} placeholder="Template Name" />
                {errors.templatename && <span className="text-sm font-normal text-danger-700">{errors.templatename}</span>}
              </label>
              <label className="field-label">Choose payment method
                <select className="input" value={formData.paymentMode?.value || ''} onChange={(e) => set('paymentMode', PAYMENT_OPTIONS.find((o) => o.value === e.target.value) || null)}>
                  <option value="">Select Payment Mode</option>
                  {PAYMENT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </label>
              <div className="md:col-span-2">
                <ShortcodeTextField label="Description" value={formData.description} onChange={(v) => set('description', v)} placeholder="Description shown on the invoice, e.g. [LAST_MONTH_NAME] bookkeeping for [ACCOUNT_NAME]"
                  multiline rows={3} maxLength={50000} shortcuts={accountShortcuts} />
              </div>
            </div>
          </Section>

          <Section step={2} title="Line items" description="Client-facing itemized list of products and services">
            <LineItemsAndSummary rows={formData.rows} onChange={(rows) => { setFormData((f) => ({ ...f, rows })); setErrors((e) => ({ ...e, rows: undefined })); }}
              taxRate={formData.taxRate} onTaxRateChange={(v) => set('taxRate', v)} error={errors.rows} hideHeading />
          </Section>

          <Section step={3} title="Note to client" description="Shown at the bottom of the invoice">
            <TextEditor ariaLabel="Note to client" value={formData.clientNote} onChange={(html) => set('clientNote', html)} shortcuts={contactShortcuts} placeholder="e.g. Thank you for your business! Payment is due within 15 days." minHeight={140} />
          </Section>
        </div>

        {/* ===== SIDEBAR: summary + settings ===== */}
        <aside className="flex flex-col gap-6 xl:sticky xl:top-24">
          <Section icon={<FiFileText size={15} />} title="At a glance" bodyClass="px-5 py-3">
            <dl className="divide-y divide-line-soft">
              <Glance label="Total"><span className="text-lg text-brand-600" data-testid="glance-total">{money(totalAmount)}</span></Glance>
              <Glance label="Line items">{formData.rows.length}</Glance>
              <Glance label="Payment">{paymentLabel(formData.paymentMode)}</Glance>
              <Glance label="Email on create">{formData.emailToClient ? 'On' : 'Off'}</Glance>
              <Glance label="Reminders">{formData.invoiceReminders ? `Every ${formData.daysNextReminder || '–'}d · ${formData.numOfReminder || '–'}×` : 'Off'}</Glance>
            </dl>
            <button type="button" onClick={() => setModal('preview')} className="btn mt-3 w-full border border-brand-600 bg-brand-50 text-brand-600 hover:bg-brand-100"><FiEye aria-hidden="true" /> Preview invoice</button>
          </Section>

          <Section icon={<FiBell size={15} />} title="Email & Reminders" description="What happens after the invoice is created">
            <div className="divide-y divide-line-soft">
              <ToggleSetting label="Send email to client when invoice created" description="Sends the invoice with your message"
                checked={!!formData.emailToClient} onChange={(v) => set('emailToClient', v)}>
                <ShortcodeTextField label="Email Message to Client" value={formData.clientmsg} onChange={(v) => set('clientmsg', v)}
                  placeholder="Enter email message to client..." multiline rows={3} shortcuts={contactShortcuts} error={errors.clientmsg} />
              </ToggleSetting>
              <ToggleSetting label="Pay invoice with credits if available" description="Uses the account’s credit balance first"
                checked={!!formData.payUsingCredits} onChange={(v) => set('payUsingCredits', v)} />
              <ToggleSetting label="Send Reminders to clients" description="Until the invoice is paid"
                checked={!!formData.invoiceReminders} onChange={(v) => set('invoiceReminders', v)}>
                <div className="grid grid-cols-2 gap-3">
                  <label className="field-label text-xs">Days until next reminder
                    <input type="number" min="1" className={cx('input', errors.daysNextReminder && 'border-danger-700')} placeholder="Days until next reminder" value={formData.daysNextReminder} onChange={(e) => set('daysNextReminder', e.target.value)} />
                  </label>
                  <label className="field-label text-xs">Number of reminders
                    <input type="number" min="1" className={cx('input', errors.numOfReminder && 'border-danger-700')} placeholder="Number of reminders" value={formData.numOfReminder} onChange={(e) => set('numOfReminder', e.target.value)} />
                  </label>
                </div>
                {(errors.daysNextReminder || errors.numOfReminder) && <p className="mt-1.5 text-sm text-danger-700">{errors.daysNextReminder || errors.numOfReminder}</p>}
              </ToggleSetting>
            </div>
          </Section>
        </aside>
      </div>

      {/* ===== Sticky action bar ===== */}
      <div className="sticky bottom-0 z-10 -mx-4 -mb-6 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:-mb-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          {dirty && <span className="mr-auto flex items-center gap-2 text-sm font-semibold text-warning-700"><span className="h-2 w-2 rounded-full bg-warning-700" aria-hidden="true" />Unsaved changes</span>}
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn border border-brand-600 bg-brand-50 text-brand-600 hover:bg-brand-100" onClick={onSave}>{isEditMode ? 'Update' : 'Save'}</button>
          <button type="button" className="btn-primary" onClick={onSaveAndExit}>{isEditMode ? 'Update & Exit' : 'Save & Exit'}</button>
        </div>
      </div>

      {modal === 'preview' && <InvoicePreview form={formData} onClose={() => setModal(null)} />}
      {modal === 'discard' && (
        <Modal title="Discard changes?" onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Keep editing</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => navigate(LIST_PATH)}>Discard</button></>}>
          <p className="text-muted">Your changes to this invoice template haven't been saved.</p>
        </Modal>
      )}
      {modal === 'delete' && (
        <Modal title={`Delete “${saved.templatename}”?`} onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => { deleteInvoiceTemplates([editingId]); navigate(LIST_PATH, { state: { toast: `Deleted “${saved.templatename}”` } }); }}>Delete</button></>}>
          <p className="text-muted">Invoices already created from this template are not affected.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}