// import { useEffect, useMemo, useRef, useState } from 'react';
// import { FiEdit2, FiFolder, FiPlus, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
// import { RATE_SUFFIX, RATE_TYPES, SEED_CATEGORIES, SEED_SERVICES } from '../../../data/servicesData';
// import Pagination, { usePagination } from '../../../components/Pagination';

// const cx = (...c) => c.filter(Boolean).join(' ');

// const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
// const formatRate = (rate, type) => (rate === '' || rate == null ? '—' : `${money.format(Number(rate))}${RATE_SUFFIX[type] || ''}`);
// const newId = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// /* ------------------------------------------------------------------ */
// /* Shared styles                                                       */
// /* ------------------------------------------------------------------ */

// const inputCls = 'block h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30';
// const labelCls = 'mb-1.5 block text-sm font-semibold text-ink';
// const btnPrimary = 'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-600/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:ring-offset-2';
// const btnSecondary = 'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-ink hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40';
// const iconBtn = 'flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40';

// /* ------------------------------------------------------------------ */
// /* Small helpers                                                       */
// /* ------------------------------------------------------------------ */

// function useEscape(onEscape, active = true) {
//   useEffect(() => {
//     if (!active) return;
//     const onKey = (e) => e.key === 'Escape' && onEscape();
//     window.addEventListener('keydown', onKey);
//     return () => window.removeEventListener('keydown', onKey);
//   }, [onEscape, active]);
// }

// function useBodyLock(active) {
//   useEffect(() => {
//     if (!active) return;
//     const prev = document.body.style.overflow;
//     document.body.style.overflow = 'hidden';
//     return () => { document.body.style.overflow = prev; };
//   }, [active]);
// }

// function Toggle({ checked, onChange, label }) {
//   return (
//     <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
//       className={cx('relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:ring-offset-2',
//         checked ? 'bg-brand-600' : 'bg-line-strong')}>
//       <span className={cx('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
//     </button>
//   );
// }

// /* ------------------------------------------------------------------ */
// /* Category modal (create + edit)                                      */
// /* ------------------------------------------------------------------ */

// function CategoryModal({ category, existingNames, onClose, onSave }) {
//   const [name, setName] = useState(category?.name || '');
//   const [description, setDescription] = useState(category?.description || '');
//   const [error, setError] = useState('');
//   const nameRef = useRef(null);

//   useEffect(() => { nameRef.current?.focus(); }, []);
//   useEscape(onClose);

//   const save = () => {
//     const trimmed = name.trim();
//     if (!trimmed) return setError('Enter a category name.');
//     const clash = existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase() && n.toLowerCase() !== (category?.name || '').toLowerCase());
//     if (clash) return setError('A category with this name already exists.');
//     onSave({ name: trimmed, description: description.trim() });
//   };

//   return (
//     <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4"
//       onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
//       <div role="dialog" aria-modal="true" aria-labelledby="category-modal-title"
//         className="w-full max-w-md rounded-t-xl bg-surface shadow-pop sm:rounded-xl">
//         <div className="flex items-center justify-between border-b border-line px-5 py-4">
//           <h2 id="category-modal-title" className="text-lg font-bold text-ink">{category ? 'Edit category' : 'New category'}</h2>
//           <button type="button" onClick={onClose} aria-label="Close" className={iconBtn}><FiX size={18} /></button>
//         </div>

//         <form className="space-y-4 px-5 py-5" onSubmit={(e) => { e.preventDefault(); save(); }}>
//           <div>
//             <label htmlFor="category-name" className={labelCls}>Category name <span className="text-red-600">*</span></label>
//             <input id="category-name" ref={nameRef} value={name} placeholder="e.g. Tax Preparation"
//               onChange={(e) => { setName(e.target.value); setError(''); }}
//               aria-invalid={!!error} aria-describedby={error ? 'category-name-error' : undefined}
//               className={cx(inputCls, error && 'border-red-600 focus:border-red-600 focus:ring-red-600/30')} />
//             {error && <p id="category-name-error" className="mt-1.5 text-sm text-red-600">{error}</p>}
//           </div>
//           <div>
//             <label htmlFor="category-description" className={labelCls}>Description</label>
//             <textarea id="category-description" rows={3} value={description} placeholder="What kind of services go here?"
//               onChange={(e) => setDescription(e.target.value)} className={cx(inputCls, 'h-auto resize-none py-2.5')} />
//           </div>
//           <div className="flex justify-end gap-3 pt-1">
//             <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
//             <button type="submit" className={btnPrimary}>{category ? 'Save changes' : 'Create category'}</button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// /* ------------------------------------------------------------------ */
// /* Service drawer (create + edit share this one drawer)                */
// /* ------------------------------------------------------------------ */

// const NEW_CATEGORY = '__new__';

// function ServiceDrawer({ service, categories, onClose, onSave, onCreateCategory }) {
//   const [form, setForm] = useState(() => ({
//     name: service?.name || '',
//     description: service?.description || '',
//     rate: service?.rate || '',
//     rateType: service?.rateType || '',
//     tax: service?.tax || false,
//     categoryId: service?.categoryId || '',
//   }));
//   const [error, setError] = useState('');
//   const [categoryModalOpen, setCategoryModalOpen] = useState(false);
//   const nameRef = useRef(null);

//   useEffect(() => { nameRef.current?.focus(); }, []);
//   useEscape(onClose, !categoryModalOpen); // Escape closes the modal first, not the drawer

//   const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

//   const handleRateChange = (e) => {
//     let v = e.target.value.replace(/[^\d.]/g, '');
//     const [whole, ...rest] = v.split('.');
//     v = rest.length ? `${whole}.${rest.join('').slice(0, 2)}` : whole;
//     set('rate')(v);
//   };
//   const formatRateOnBlur = () => {
//     if (form.rate !== '' && !Number.isNaN(Number(form.rate))) set('rate')(Number(form.rate).toFixed(2));
//   };

//   const handleCategoryChange = (e) => {
//     if (e.target.value === NEW_CATEGORY) return setCategoryModalOpen(true); // keep the old value until a category is created
//     set('categoryId')(e.target.value);
//   };

//   const save = () => {
//     if (!form.name.trim()) {
//       setError('Enter a service name.');
//       nameRef.current?.focus();
//       return;
//     }
//     onSave({ ...form, name: form.name.trim(), description: form.description.trim(), categoryId: form.categoryId || null });
//   };

//   return (
//     <div className="fixed inset-0 z-50 overflow-hidden">
//       <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

//       <div role="dialog" aria-modal="true" aria-labelledby="service-drawer-title"
//         className="absolute right-0 top-0 flex h-full w-full flex-col bg-surface shadow-pop sm:w-[560px]">
//         <div className="flex flex-none items-center justify-between border-b border-line px-5 py-4">
//           <h2 id="service-drawer-title" className="text-lg font-bold text-ink">{service ? 'Edit service' : 'New service'}</h2>
//           <button type="button" onClick={onClose} aria-label="Close" className={iconBtn}><FiX size={18} /></button>
//         </div>

//         <form id="service-form" className="flex-1 space-y-5 overflow-y-auto px-5 py-5" onSubmit={(e) => { e.preventDefault(); save(); }}>
//           <div>
//             <label htmlFor="service-name" className={labelCls}>Service name <span className="text-red-600">*</span></label>
//             <input id="service-name" ref={nameRef} type="text" placeholder="e.g. Monthly Bookkeeping" value={form.name}
//               onChange={(e) => { set('name')(e.target.value); setError(''); }}
//               aria-invalid={!!error} aria-describedby={error ? 'service-name-error' : undefined}
//               className={cx(inputCls, error && 'border-red-600 focus:border-red-600 focus:ring-red-600/30')} />
//             {error && <p id="service-name-error" className="mt-1.5 text-sm text-red-600">{error}</p>}
//           </div>

//           <div>
//             <label htmlFor="service-description" className={labelCls}>Description</label>
//             <textarea id="service-description" rows={3} placeholder="What’s included in this service?" value={form.description}
//               onChange={(e) => set('description')(e.target.value)} className={cx(inputCls, 'h-auto resize-none py-2.5')} />
//           </div>

//           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//             <div>
//               <label htmlFor="service-rate" className={labelCls}>Rate</label>
//               <div className="relative">
//                 <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">$</span>
//                 <input id="service-rate" type="text" inputMode="decimal" placeholder="0.00" value={form.rate}
//                   onChange={handleRateChange} onBlur={formatRateOnBlur} className={cx(inputCls, 'pl-7 tabular-nums')} />
//               </div>
//             </div>
//             <div>
//               <label htmlFor="service-rate-type" className={labelCls}>Rate type</label>
//               <select id="service-rate-type" value={form.rateType} onChange={(e) => set('rateType')(e.target.value)} className={inputCls}>
//                 <option value="">Select rate type</option>
//                 {RATE_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
//               </select>
//             </div>
//           </div>

//           <div className="flex items-center justify-between gap-4 rounded-md border border-line bg-subtle px-4 py-3">
//             <div>
//               <p id="service-tax-label" className="text-sm font-semibold text-ink">Taxable</p>
//               <p className="text-sm text-muted">Add sales tax when this service is invoiced.</p>
//             </div>
//             <Toggle checked={form.tax} onChange={set('tax')} label="Taxable" />
//           </div>

//           <div>
//             <label htmlFor="service-category" className={labelCls}>Category</label>
//             <select id="service-category" value={form.categoryId} onChange={handleCategoryChange} className={inputCls}>
//               <option value="">No category</option>
//               {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
//               <option disabled>──────────</option>
//               <option value={NEW_CATEGORY}>+ Add new category</option>
//             </select>
//           </div>
//         </form>

//         <div className="flex flex-none items-center justify-end gap-3 border-t border-line px-5 py-4">
//           <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
//           <button type="submit" form="service-form" className={btnPrimary}>{service ? 'Save changes' : 'Create service'}</button>
//         </div>
//       </div>

//       {categoryModalOpen && (
//         <CategoryModal
//           existingNames={categories.map((c) => c.name)}
//           onClose={() => setCategoryModalOpen(false)}
//           onSave={(data) => {
//             const created = onCreateCategory(data);
//             set('categoryId')(created.id); // new category is selected right away
//             setCategoryModalOpen(false);
//           }}
//         />
//       )}
//     </div>
//   );
// }

// /* ------------------------------------------------------------------ */
// /* Delete confirmation                                                 */
// /* ------------------------------------------------------------------ */

// function ConfirmDialog({ title, message, confirmLabel, onCancel, onConfirm }) {
//   useEscape(onCancel);
//   return (
//     <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
//       <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-sm rounded-xl bg-surface p-5 shadow-pop">
//         <h2 id="confirm-title" className="text-lg font-bold text-ink">{title}</h2>
//         <p className="mt-2 text-muted">{message}</p>
//         <div className="mt-5 flex justify-end gap-3">
//           <button type="button" onClick={onCancel} className={btnSecondary} autoFocus>Cancel</button>
//           <button type="button" onClick={onConfirm} className={cx(btnPrimary, 'bg-red-600 hover:bg-red-600/90 focus-visible:ring-red-600/40')}>{confirmLabel}</button>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ------------------------------------------------------------------ */
// /* Page                                                                */
// /* ------------------------------------------------------------------ */

// export default function ServicesPage() {
//   const [categories, setCategories] = useState(SEED_CATEGORIES);
//   const [services, setServices] = useState(SEED_SERVICES);
//   const [view, setView] = useState('services'); // 'services' | 'categories'
//   const [query, setQuery] = useState('');
//   const [categoryFilter, setCategoryFilter] = useState('all');

//   const [drawer, setDrawer] = useState(null);          // null | { id: string | null }
//   const [categoryModal, setCategoryModal] = useState(null); // null | { id: string | null }
//   const [confirm, setConfirm] = useState(null);        // null | { kind: 'service' | 'category', id }
//   const [toast, setToast] = useState('');

//   useBodyLock(!!drawer || !!categoryModal || !!confirm);

//   const notify = (m) => { setToast(m); window.clearTimeout(notify.t); notify.t = window.setTimeout(() => setToast(''), 2600); };

//   const categoryById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
//   const serviceCount = useMemo(() => services.reduce((acc, s) => { if (s.categoryId) acc[s.categoryId] = (acc[s.categoryId] || 0) + 1; return acc; }, {}), [services]);

//   const q = query.trim().toLowerCase();
//   const visibleServices = services.filter((s) => {
//     if (categoryFilter === 'none' && s.categoryId) return false;
//     if (categoryFilter !== 'all' && categoryFilter !== 'none' && s.categoryId !== categoryFilter) return false;
//     if (!q) return true;
//     return [s.name, s.description, categoryById[s.categoryId]?.name].some((v) => v?.toLowerCase().includes(q));
//   });
//   const visibleCategories = categories.filter((c) => !q || [c.name, c.description].some((v) => v?.toLowerCase().includes(q)));

//   // Paging (page size is remembered per table on this device)
//   const servicePaging = usePagination(visibleServices, { storageKey: 'services' });
//   const categoryPaging = usePagination(visibleCategories, { storageKey: 'serviceCategories' });
//   const { setPage: setServicePage } = servicePaging;
//   const { setPage: setCategoryPage } = categoryPaging;

//   // Search / filter changes always start from page 1
//   const changeQuery = (value) => { setQuery(value); setServicePage(1); setCategoryPage(1); };
//   const changeCategoryFilter = (value) => { setCategoryFilter(value); setServicePage(1); };

//   /* --- actions --- */
//   const createCategory = (data) => {
//     const rec = { id: newId('cat'), ...data };
//     setCategories((list) => [...list, rec]);
//     notify(`${rec.name} was added`);
//     return rec;
//   };

//   const saveService = (data) => {
//     if (drawer?.id) {
//       setServices((list) => list.map((s) => (s.id === drawer.id ? { ...s, ...data } : s)));
//       notify(`${data.name} was updated`);
//     } else {
//       setServices((list) => [{ id: newId('svc'), ...data }, ...list]);
//       setServicePage(1); // new service is added at the top, so show it
//       notify(`${data.name} was added`);
//     }
//     setDrawer(null);
//   };

//   const saveCategory = (data) => {
//     if (categoryModal?.id) {
//       setCategories((list) => list.map((c) => (c.id === categoryModal.id ? { ...c, ...data } : c)));
//       notify(`${data.name} was updated`);
//     } else {
//       createCategory(data);
//     }
//     setCategoryModal(null);
//   };

//   const confirmDelete = () => {
//     if (confirm.kind === 'service') {
//       const s = services.find((x) => x.id === confirm.id);
//       setServices((list) => list.filter((x) => x.id !== confirm.id));
//       notify(`${s?.name} was deleted`);
//     } else {
//       const c = categoryById[confirm.id];
//       setCategories((list) => list.filter((x) => x.id !== confirm.id));
//       setServices((list) => list.map((s) => (s.categoryId === confirm.id ? { ...s, categoryId: null } : s)));
//       if (categoryFilter === confirm.id) setCategoryFilter('all');
//       notify(`${c?.name} was deleted`);
//     }
//     setConfirm(null);
//   };

//   const editingService = drawer?.id ? services.find((s) => s.id === drawer.id) : null;
//   const editingCategory = categoryModal?.id ? categoryById[categoryModal.id] : null;
//   const confirmTarget = confirm && (confirm.kind === 'service' ? services.find((s) => s.id === confirm.id) : categoryById[confirm.id]);

//   return (
//     <div className="flex flex-col gap-6">
//       {/* Header */}
//       <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-ink">Services</h1>
//           <p className="mt-1 max-w-[65ch] text-muted">The services your firm offers, with rates you can add to invoices and proposals.</p>
//         </div>
//         <button type="button" className={cx(btnPrimary, 'self-start sm:self-auto')}
//           onClick={() => (view === 'services' ? setDrawer({ id: null }) : setCategoryModal({ id: null }))}>
//           <FiPlus size={18} aria-hidden="true" />
//           {view === 'services' ? 'New service' : 'New category'}
//         </button>
//       </header>

//       {/* View switch + filters */}
//       <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
//         <div role="tablist" aria-label="Show" className="inline-flex self-start rounded-md border border-line bg-subtle p-1">
//           {[
//             { key: 'services', label: 'Services', count: services.length },
//             { key: 'categories', label: 'Categories', count: categories.length },
//           ].map((t) => (
//             <button key={t.key} type="button" role="tab" aria-selected={view === t.key}
//               onClick={() => { setView(t.key); changeQuery(''); }}
//               className={cx('inline-flex min-h-[36px] items-center gap-2 rounded px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
//                 view === t.key ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink')}>
//               {t.label}
//               <span className={cx('rounded-full px-2 text-xs tabular-nums', view === t.key ? 'bg-brand-600/10 text-brand-600' : 'bg-line text-muted')}>{t.count}</span>
//             </button>
//           ))}
//         </div>

//         <div className="flex flex-col gap-3 sm:flex-row">
//           <div className="relative sm:w-72">
//             <FiSearch size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
//             <input type="search" value={query} onChange={(e) => changeQuery(e.target.value)} aria-label={`Search ${view}`}
//               placeholder={view === 'services' ? 'Search services' : 'Search categories'} className={cx(inputCls, 'pl-10')} />
//           </div>
//           {view === 'services' && (
//             <select value={categoryFilter} onChange={(e) => changeCategoryFilter(e.target.value)} aria-label="Filter by category" className={cx(inputCls, 'sm:w-56')}>
//               <option value="all">All categories</option>
//               {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
//               <option value="none">No category</option>
//             </select>
//           )}
//         </div>
//       </div>

//       {/* ---------------- Services list ---------------- */}
//       {view === 'services' && (
//         visibleServices.length === 0 ? (
//           <EmptyState
//             title={services.length ? 'No services match your search' : 'No services yet'}
//             text={services.length ? 'Try a different name or category.' : 'Add the services your firm offers so you can reuse them on invoices and proposals.'}
//             action={!services.length && <button type="button" className={btnPrimary} onClick={() => setDrawer({ id: null })}><FiPlus size={18} aria-hidden="true" />New service</button>} />
//         ) : (
//           <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
//             {/* Tablet & desktop: table */}
//             <div className="hidden overflow-x-auto md:block">
//               <table className="w-full min-w-[720px] text-left">
//                 <thead className="border-b border-line bg-subtle text-sm text-muted">
//                   <tr>
//                     <th scope="col" className="px-4 py-3 font-semibold">Service</th>
//                     <th scope="col" className="px-4 py-3 font-semibold">Category</th>
//                     <th scope="col" className="px-4 py-3 text-right font-semibold">Rate</th>
//                     <th scope="col" className="px-4 py-3 font-semibold">Tax</th>
//                     <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-line">
//                   {servicePaging.pageItems.map((s) => (
//                     <tr key={s.id} className="hover:bg-subtle/60">
//                       <td className="max-w-[360px] px-4 py-3">
//                         <button type="button" onClick={() => setDrawer({ id: s.id })} className="text-left font-semibold text-ink hover:text-brand-600 focus-visible:outline-none focus-visible:underline">{s.name}</button>
//                         {s.description && <p className="mt-0.5 truncate text-sm text-muted">{s.description}</p>}
//                       </td>
//                       <td className="px-4 py-3"><CategoryPill category={categoryById[s.categoryId]} /></td>
//                       <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-ink">{formatRate(s.rate, s.rateType)}</td>
//                       <td className="px-4 py-3 text-sm">{s.tax ? <span className="font-semibold text-ink">Taxable</span> : <span className="text-muted">No</span>}</td>
//                       <td className="px-4 py-3">
//                         <div className="flex justify-end gap-1">
//                           <button type="button" onClick={() => setDrawer({ id: s.id })} aria-label={`Edit ${s.name}`} className={iconBtn}><FiEdit2 size={16} /></button>
//                           <button type="button" onClick={() => setConfirm({ kind: 'service', id: s.id })} aria-label={`Delete ${s.name}`} className={cx(iconBtn, 'hover:text-red-600')}><FiTrash2 size={16} /></button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Phones: list rows */}
//             <ul className="divide-y divide-line md:hidden">
//               {servicePaging.pageItems.map((s) => (
//                 <li key={s.id} className="p-4">
//                   <div className="flex items-start justify-between gap-3">
//                     <button type="button" onClick={() => setDrawer({ id: s.id })} className="text-left font-semibold text-ink">{s.name}</button>
//                     <span className="whitespace-nowrap font-semibold tabular-nums text-ink">{formatRate(s.rate, s.rateType)}</span>
//                   </div>
//                   {s.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{s.description}</p>}
//                   <div className="mt-3 flex items-center justify-between gap-2">
//                     <div className="flex flex-wrap items-center gap-2">
//                       <CategoryPill category={categoryById[s.categoryId]} />
//                       {s.tax && <span className="text-sm font-semibold text-ink">Taxable</span>}
//                     </div>
//                     <div className="flex gap-1">
//                       <button type="button" onClick={() => setDrawer({ id: s.id })} aria-label={`Edit ${s.name}`} className={iconBtn}><FiEdit2 size={16} /></button>
//                       <button type="button" onClick={() => setConfirm({ kind: 'service', id: s.id })} aria-label={`Delete ${s.name}`} className={cx(iconBtn, 'hover:text-red-600')}><FiTrash2 size={16} /></button>
//                     </div>
//                   </div>
//                 </li>
//               ))}
//             </ul>

//             <Pagination {...servicePaging} label="services" />
//           </div>
//         )
//       )}

//       {/* ---------------- Categories list ---------------- */}
//       {view === 'categories' && (
//         visibleCategories.length === 0 ? (
//           <EmptyState
//             title={categories.length ? 'No categories match your search' : 'No categories yet'}
//             text={categories.length ? 'Try a different name.' : 'Group your services into categories to keep the list tidy.'}
//             action={!categories.length && <button type="button" className={btnPrimary} onClick={() => setCategoryModal({ id: null })}><FiPlus size={18} aria-hidden="true" />New category</button>} />
//         ) : (
//           <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
//             <div className="overflow-x-auto">
//             <table className="w-full min-w-[520px] text-left">
//               <thead className="border-b border-line bg-subtle text-sm text-muted">
//                 <tr>
//                   <th scope="col" className="px-4 py-3 font-semibold">Category</th>
//                   <th scope="col" className="hidden px-4 py-3 font-semibold sm:table-cell">Description</th>
//                   <th scope="col" className="px-4 py-3 text-right font-semibold">Services</th>
//                   <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-line">
//                 {categoryPaging.pageItems.map((c) => (
//                   <tr key={c.id} className="hover:bg-subtle/60">
//                     <td className="px-4 py-3">
//                       <button type="button" onClick={() => setCategoryModal({ id: c.id })} className="flex items-center gap-2 text-left font-semibold text-ink hover:text-brand-600">
//                         <FiFolder size={16} className="flex-none text-brand-600" aria-hidden="true" />{c.name}
//                       </button>
//                       {c.description && <p className="mt-0.5 text-sm text-muted sm:hidden">{c.description}</p>}
//                     </td>
//                     <td className="hidden max-w-[360px] px-4 py-3 text-sm text-muted sm:table-cell">{c.description || '—'}</td>
//                     <td className="px-4 py-3 text-right tabular-nums">
//                       <button type="button" onClick={() => { setView('services'); changeQuery(''); changeCategoryFilter(c.id); }}
//                         className="font-semibold text-brand-600 hover:underline" aria-label={`Show ${serviceCount[c.id] || 0} services in ${c.name}`}>
//                         {serviceCount[c.id] || 0}
//                       </button>
//                     </td>
//                     <td className="px-4 py-3">
//                       <div className="flex justify-end gap-1">
//                         <button type="button" onClick={() => setCategoryModal({ id: c.id })} aria-label={`Edit ${c.name}`} className={iconBtn}><FiEdit2 size={16} /></button>
//                         <button type="button" onClick={() => setConfirm({ kind: 'category', id: c.id })} aria-label={`Delete ${c.name}`} className={cx(iconBtn, 'hover:text-red-600')}><FiTrash2 size={16} /></button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//             </div>

//             <Pagination {...categoryPaging} label="categories" />
//           </div>
//         )
//       )}

//       {/* ---------------- Overlays ---------------- */}
//       {drawer && (
//         <ServiceDrawer
//           key={drawer.id || 'new'}
//           service={editingService}
//           categories={categories}
//           onClose={() => setDrawer(null)}
//           onSave={saveService}
//           onCreateCategory={createCategory}
//         />
//       )}

//       {categoryModal && (
//         <CategoryModal
//           key={categoryModal.id || 'new'}
//           category={editingCategory}
//           existingNames={categories.map((c) => c.name)}
//           onClose={() => setCategoryModal(null)}
//           onSave={saveCategory}
//         />
//       )}

//       {confirm && confirmTarget && (
//         <ConfirmDialog
//           title={confirm.kind === 'service' ? 'Delete service?' : 'Delete category?'}
//           message={confirm.kind === 'service'
//             ? `${confirmTarget.name} will be removed from your services list.`
//             : serviceCount[confirm.id]
//               ? `${confirmTarget.name} will be deleted. Its ${serviceCount[confirm.id]} service${serviceCount[confirm.id] > 1 ? 's' : ''} will stay, with no category.`
//               : `${confirmTarget.name} will be deleted.`}
//           confirmLabel={confirm.kind === 'service' ? 'Delete service' : 'Delete category'}
//           onCancel={() => setConfirm(null)}
//           onConfirm={confirmDelete}
//         />
//       )}

//       {toast && <div role="status" className="fixed left-1/2 top-6 z-[70] -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white shadow-pop">{toast}</div>}
//     </div>
//   );
// }

// function CategoryPill({ category }) {
//   if (!category) return <span className="text-sm text-muted">No category</span>;
//   return <span className="inline-flex items-center rounded-full bg-brand-600/10 px-2.5 py-0.5 text-sm font-semibold text-brand-600">{category.name}</span>;
// }

// function EmptyState({ title, text, action }) {
//   return (
//     <div className="flex flex-col items-center rounded-lg border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
//       <p className="text-lg font-bold text-ink">{title}</p>
//       <p className="mt-1 max-w-[48ch] text-muted">{text}</p>
//       {action && <div className="mt-5">{action}</div>}
//     </div>
//   );
// }
import { useEffect, useMemo, useRef, useState } from 'react';
import { FiCopy, FiEdit2, FiFolder, FiPlus, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import { RATE_SUFFIX, RATE_TYPES } from '../../../data/servicesData';
import Pagination, { usePagination } from '../../../components/Pagination';
import { useData } from '../../../context/DataContext';
import RowActionsMenu from '../../../components/RowActionsMenu';

const cx = (...c) => c.filter(Boolean).join(' ');

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const formatRate = (rate, type) => (rate === '' || rate == null ? '—' : `${money.format(Number(rate))}${RATE_SUFFIX[type] || ''}`);

/* ------------------------------------------------------------------ */
/* Shared styles                                                       */
/* ------------------------------------------------------------------ */

const inputCls = 'block h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30';
const labelCls = 'mb-1.5 block text-sm font-semibold text-ink';
const btnPrimary = 'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-600/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:ring-offset-2';
const btnSecondary = 'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-ink hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40';
const iconBtn = 'flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40';

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function useEscape(onEscape, active = true) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => e.key === 'Escape' && onEscape();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onEscape, active]);
}

function useBodyLock(active) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [active]);
}

function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cx('relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:ring-offset-2',
        checked ? 'bg-brand-600' : 'bg-line-strong')}>
      <span className={cx('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Category modal (create + edit)                                      */
/* ------------------------------------------------------------------ */

function CategoryModal({ category, nameTaken, onClose, onSave }) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [error, setError] = useState('');
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);
  useEscape(onClose);

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return setError('Enter a category name.');
    if (nameTaken(trimmed, category?.id)) return setError('A category with this name already exists.');
    onSave({ name: trimmed, description: description.trim() });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="category-modal-title"
        className="w-full max-w-md rounded-t-xl bg-surface shadow-pop sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="category-modal-title" className="text-lg font-bold text-ink">{category ? 'Edit category' : 'New category'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className={iconBtn}><FiX size={18} /></button>
        </div>

        <form className="space-y-4 px-5 py-5" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <div>
            <label htmlFor="category-name" className={labelCls}>Category name <span className="text-red-600">*</span></label>
            <input id="category-name" ref={nameRef} value={name} placeholder="e.g. Tax Preparation"
              onChange={(e) => { setName(e.target.value); setError(''); }}
              aria-invalid={!!error} aria-describedby={error ? 'category-name-error' : undefined}
              className={cx(inputCls, error && 'border-red-600 focus:border-red-600 focus:ring-red-600/30')} />
            {error && <p id="category-name-error" className="mt-1.5 text-sm text-red-600">{error}</p>}
          </div>
          <div>
            <label htmlFor="category-description" className={labelCls}>Description</label>
            <textarea id="category-description" rows={3} value={description} placeholder="What kind of services go here?"
              onChange={(e) => setDescription(e.target.value)} className={cx(inputCls, 'h-auto resize-none py-2.5')} />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
            <button type="submit" className={btnPrimary}>{category ? 'Save changes' : 'Create category'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Service drawer (create + edit share this one drawer)                */
/* ------------------------------------------------------------------ */

const NEW_CATEGORY = '__new__';

function ServiceDrawer({ service, categories, nameTaken, categoryNameTaken, onClose, onSave, onCreateCategory }) {
  const [form, setForm] = useState(() => ({
    name: service?.name || '',
    description: service?.description || '',
    rate: service?.rate || '',
    rateType: service?.rateType || '',
    tax: service?.tax || false,
    categoryId: service?.categoryId || '',
  }));
  const [error, setError] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);
  useEscape(onClose, !categoryModalOpen); // Escape closes the modal first, not the drawer

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleRateChange = (e) => {
    let v = e.target.value.replace(/[^\d.]/g, '');
    const [whole, ...rest] = v.split('.');
    v = rest.length ? `${whole}.${rest.join('').slice(0, 2)}` : whole;
    set('rate')(v);
  };
  const formatRateOnBlur = () => {
    if (form.rate !== '' && !Number.isNaN(Number(form.rate))) set('rate')(Number(form.rate).toFixed(2));
  };

  const handleCategoryChange = (e) => {
    if (e.target.value === NEW_CATEGORY) return setCategoryModalOpen(true); // keep the old value until a category is created
    set('categoryId')(e.target.value);
  };

  const save = () => {
    const name = form.name.trim();
    if (!name) {
      setError('Enter a service name.');
      nameRef.current?.focus();
      return;
    }
    if (nameTaken(name, service?.id)) {
      setError('A service with this name already exists.');
      nameRef.current?.focus();
      return;
    }
    onSave({ ...form, name, description: form.description.trim(), categoryId: form.categoryId || null });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div role="dialog" aria-modal="true" aria-labelledby="service-drawer-title"
        className="absolute right-0 top-0 flex h-full w-full flex-col bg-surface shadow-pop sm:w-[560px]">
        <div className="flex flex-none items-center justify-between border-b border-line px-5 py-4">
          <h2 id="service-drawer-title" className="text-lg font-bold text-ink">{service ? 'Edit service' : 'New service'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className={iconBtn}><FiX size={18} /></button>
        </div>

        <form id="service-form" className="flex-1 space-y-5 overflow-y-auto px-5 py-5" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <div>
            <label htmlFor="service-name" className={labelCls}>Service name <span className="text-red-600">*</span></label>
            <input id="service-name" ref={nameRef} type="text" placeholder="e.g. Monthly Bookkeeping" value={form.name}
              onChange={(e) => { set('name')(e.target.value); setError(''); }}
              aria-invalid={!!error} aria-describedby={error ? 'service-name-error' : undefined}
              className={cx(inputCls, error && 'border-red-600 focus:border-red-600 focus:ring-red-600/30')} />
            {error && <p id="service-name-error" className="mt-1.5 text-sm text-red-600">{error}</p>}
          </div>

          <div>
            <label htmlFor="service-description" className={labelCls}>Description</label>
            <textarea id="service-description" rows={3} placeholder="What’s included in this service?" value={form.description}
              onChange={(e) => set('description')(e.target.value)} className={cx(inputCls, 'h-auto resize-none py-2.5')} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="service-rate" className={labelCls}>Rate</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">$</span>
                <input id="service-rate" type="text" inputMode="decimal" placeholder="0.00" value={form.rate}
                  onChange={handleRateChange} onBlur={formatRateOnBlur} className={cx(inputCls, 'pl-7 tabular-nums')} />
              </div>
            </div>
            <div>
              <label htmlFor="service-rate-type" className={labelCls}>Rate type</label>
              <select id="service-rate-type" value={form.rateType} onChange={(e) => set('rateType')(e.target.value)} className={inputCls}>
                <option value="">Select rate type</option>
                {RATE_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-md border border-line bg-subtle px-4 py-3">
            <div>
              <p id="service-tax-label" className="text-sm font-semibold text-ink">Taxable</p>
              <p className="text-sm text-muted">Add sales tax when this service is invoiced.</p>
            </div>
            <Toggle checked={form.tax} onChange={set('tax')} label="Taxable" />
          </div>

          <div>
            <label htmlFor="service-category" className={labelCls}>Category</label>
            <select id="service-category" value={form.categoryId} onChange={handleCategoryChange} className={inputCls}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option disabled>──────────</option>
              <option value={NEW_CATEGORY}>+ Add new category</option>
            </select>
          </div>
        </form>

        <div className="flex flex-none items-center justify-end gap-3 border-t border-line px-5 py-4">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" form="service-form" className={btnPrimary}>{service ? 'Save changes' : 'Create service'}</button>
        </div>
      </div>

      {categoryModalOpen && (
        <CategoryModal
          nameTaken={categoryNameTaken}
          onClose={() => setCategoryModalOpen(false)}
          onSave={(data) => {
            const created = onCreateCategory(data);
            set('categoryId')(created.id); // new category is selected right away
            setCategoryModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Delete confirmation                                                 */
/* ------------------------------------------------------------------ */

function ConfirmDialog({ title, message, confirmLabel, onCancel, onConfirm }) {
  useEscape(onCancel);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-sm rounded-xl bg-surface p-5 shadow-pop">
        <h2 id="confirm-title" className="text-lg font-bold text-ink">{title}</h2>
        <p className="mt-2 text-muted">{message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className={btnSecondary} autoFocus>Cancel</button>
          <button type="button" onClick={onConfirm} className={cx(btnPrimary, 'bg-red-600 hover:bg-red-600/90 focus-visible:ring-red-600/40')}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ServicesPage() {
  const {
    services, serviceNameTaken, createService, updateService, duplicateServices, deleteServices,
    serviceCategories: categories, serviceCategoryNameTaken, saveServiceCategory, deleteServiceCategories,
  } = useData();

  const [view, setView] = useState('services'); // 'services' | 'categories'
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [drawer, setDrawer] = useState(null);          // null | { id: string | null }
  const [categoryModal, setCategoryModal] = useState(null); // null | { id: string | null }
  const [confirm, setConfirm] = useState(null);        // null | { kind: 'service' | 'category', id }
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  useBodyLock(!!drawer || !!categoryModal || !!confirm);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const notify = (m) => {
    setToast(m);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  };

  const categoryById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const serviceCount = useMemo(() => services.reduce((acc, s) => { if (s.categoryId) acc[s.categoryId] = (acc[s.categoryId] || 0) + 1; return acc; }, {}), [services]);

  const q = query.trim().toLowerCase();
  const visibleServices = services.filter((s) => {
    if (categoryFilter === 'none' && s.categoryId) return false;
    if (categoryFilter !== 'all' && categoryFilter !== 'none' && s.categoryId !== categoryFilter) return false;
    if (!q) return true;
    return [s.name, s.description, categoryById[s.categoryId]?.name].some((v) => v?.toLowerCase().includes(q));
  });
  const visibleCategories = categories.filter((c) => !q || [c.name, c.description].some((v) => v?.toLowerCase().includes(q)));

  // Paging (page size is remembered per table on this device)
  const servicePaging = usePagination(visibleServices, { storageKey: 'services' });
  const categoryPaging = usePagination(visibleCategories, { storageKey: 'serviceCategories' });
  const { setPage: setServicePage } = servicePaging;
  const { setPage: setCategoryPage } = categoryPaging;

  // Search / filter changes always start from page 1
  const changeQuery = (value) => { setQuery(value); setServicePage(1); setCategoryPage(1); };
  const changeCategoryFilter = (value) => { setCategoryFilter(value); setServicePage(1); };

  /* --- actions (all data changes go through DataContext) --- */
  const createCategory = (data) => {
    const rec = saveServiceCategory(data);
    notify(`${rec.name} was added`);
    return rec;
  };

  const saveService = (data) => {
    if (drawer?.id) {
      const rec = updateService(drawer.id, data);
      notify(`${rec?.name || data.name} was updated`);
    } else {
      const rec = createService(data);
      setServicePage(1); // new service is added at the top, so show it
      notify(`${rec.name} was added`);
    }
    setDrawer(null);
  };

  const duplicateService = (s) => {
    const [copy] = duplicateServices([s.id]);
    if (!copy) return;
    setServicePage(1); // copies are added at the top, so show it
    notify(`${copy.name} was added`);
  };

  const saveCategory = (data) => {
    if (categoryModal?.id) {
      saveServiceCategory({ id: categoryModal.id, ...data });
      notify(`${data.name} was updated`);
    } else {
      createCategory(data);
    }
    setCategoryModal(null);
  };

  const confirmDelete = () => {
    if (confirm.kind === 'service') {
      const s = services.find((x) => x.id === confirm.id);
      deleteServices([confirm.id]);
      notify(`${s?.name} was deleted`);
    } else {
      const c = categoryById[confirm.id];
      deleteServiceCategories([confirm.id]); // its services stay, with no category
      if (categoryFilter === confirm.id) setCategoryFilter('all');
      notify(`${c?.name} was deleted`);
    }
    setConfirm(null);
  };

  const editingService = drawer?.id ? services.find((s) => s.id === drawer.id) : null;
  const editingCategory = categoryModal?.id ? categoryById[categoryModal.id] : null;
  const confirmTarget = confirm && (confirm.kind === 'service' ? services.find((s) => s.id === confirm.id) : categoryById[confirm.id]);

  const serviceActions = (s) => (
    <div className="flex justify-end gap-1">
      {/* <button type="button" onClick={() => setDrawer({ id: s.id })} aria-label={`Edit ${s.name}`} title="Edit" className={iconBtn}><FiEdit2 size={16} /></button>
      <button type="button" onClick={() => duplicateService(s)} aria-label={`Duplicate ${s.name}`} title="Duplicate" className={iconBtn}><FiCopy size={16} /></button>
      <button type="button" onClick={() => setConfirm({ kind: 'service', id: s.id })} aria-label={`Delete ${s.name}`} title="Delete" className={cx(iconBtn, 'hover:text-red-600')}><FiTrash2 size={16} /></button> */}
    <RowActionsMenu
      label={s.name}
      onEdit={() => setDrawer({ id: s.id })}
      onDuplicate={() => duplicateService(s)}
      onDelete={() => setConfirm({ kind: 'service', id: s.id })}
    />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">Services</h1>
          <p className="mt-1 max-w-[65ch] text-muted">The services your firm offers, with rates you can add to invoices and proposals.</p>
        </div>
        <button type="button" className={cx(btnPrimary, 'self-start sm:self-auto')}
          onClick={() => (view === 'services' ? setDrawer({ id: null }) : setCategoryModal({ id: null }))}>
          <FiPlus size={18} aria-hidden="true" />
          {view === 'services' ? 'New service' : 'New category'}
        </button>
      </header>

      {/* View switch + filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Show" className="inline-flex self-start rounded-md border border-line bg-subtle p-1">
          {[
            { key: 'services', label: 'Services', count: services.length },
            { key: 'categories', label: 'Categories', count: categories.length },
          ].map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={view === t.key}
              onClick={() => { setView(t.key); changeQuery(''); }}
              className={cx('inline-flex min-h-[36px] items-center gap-2 rounded px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40',
                view === t.key ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink')}>
              {t.label}
              <span className={cx('rounded-full px-2 text-xs tabular-nums', view === t.key ? 'bg-brand-600/10 text-brand-600' : 'bg-line text-muted')}>{t.count}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative sm:w-72">
            <FiSearch size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input type="search" value={query} onChange={(e) => changeQuery(e.target.value)} aria-label={`Search ${view}`}
              placeholder={view === 'services' ? 'Search services' : 'Search categories'} className={cx(inputCls, 'pl-10')} />
          </div>
          {view === 'services' && (
            <select value={categoryFilter} onChange={(e) => changeCategoryFilter(e.target.value)} aria-label="Filter by category" className={cx(inputCls, 'sm:w-56')}>
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="none">No category</option>
            </select>
          )}
        </div>
      </div>

      {/* ---------------- Services list ---------------- */}
      {view === 'services' && (
        visibleServices.length === 0 ? (
          <EmptyState
            title={services.length ? 'No services match your search' : 'No services yet'}
            text={services.length ? 'Try a different name or category.' : 'Add the services your firm offers so you can reuse them on invoices and proposals.'}
            action={!services.length && <button type="button" className={btnPrimary} onClick={() => setDrawer({ id: null })}><FiPlus size={18} aria-hidden="true" />New service</button>} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
            {/* Tablet & desktop: table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-b border-line bg-subtle text-sm text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Service</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Category</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Rate</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Tax</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {servicePaging.pageItems.map((s) => (
                    <tr key={s.id} className="hover:bg-subtle/60">
                      <td className="max-w-[360px] px-4 py-3">
                        <button type="button" onClick={() => setDrawer({ id: s.id })} className="text-left font-semibold text-ink hover:text-brand-600 focus-visible:outline-none focus-visible:underline">{s.name}</button>
                        {s.description && <p className="mt-0.5 truncate text-sm text-muted">{s.description}</p>}
                      </td>
                      <td className="px-4 py-3"><CategoryPill category={categoryById[s.categoryId]} /></td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-ink">{formatRate(s.rate, s.rateType)}</td>
                      <td className="px-4 py-3 text-sm">{s.tax ? <span className="font-semibold text-ink">Taxable</span> : <span className="text-muted">No</span>}</td>
                      <td className="px-4 py-3">{serviceActions(s)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Phones: list rows */}
            <ul className="divide-y divide-line md:hidden">
              {servicePaging.pageItems.map((s) => (
                <li key={s.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" onClick={() => setDrawer({ id: s.id })} className="text-left font-semibold text-ink">{s.name}</button>
                    <span className="whitespace-nowrap font-semibold tabular-nums text-ink">{formatRate(s.rate, s.rateType)}</span>
                  </div>
                  {s.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{s.description}</p>}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CategoryPill category={categoryById[s.categoryId]} />
                      {s.tax && <span className="text-sm font-semibold text-ink">Taxable</span>}
                    </div>
                    <RowActionsMenu
                      label={s.name}
                      onEdit={() => setDrawer({ id: s.id })}
                      onDuplicate={() => duplicateService(s)}
                      onDelete={() => setConfirm({ kind: 'service', id: s.id })}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <Pagination {...servicePaging} label="services" />
          </div>
        )
      )}

      {/* ---------------- Categories list ---------------- */}
      {view === 'categories' && (
        visibleCategories.length === 0 ? (
          <EmptyState
            title={categories.length ? 'No categories match your search' : 'No categories yet'}
            text={categories.length ? 'Try a different name.' : 'Group your services into categories to keep the list tidy.'}
            action={!categories.length && <button type="button" className={btnPrimary} onClick={() => setCategoryModal({ id: null })}><FiPlus size={18} aria-hidden="true" />New category</button>} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead className="border-b border-line bg-subtle text-sm text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Category</th>
                  <th scope="col" className="hidden px-4 py-3 font-semibold sm:table-cell">Description</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Services</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {categoryPaging.pageItems.map((c) => (
                  <tr key={c.id} className="hover:bg-subtle/60">
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => setCategoryModal({ id: c.id })} className="flex items-center gap-2 text-left font-semibold text-ink hover:text-brand-600">
                        <FiFolder size={16} className="flex-none text-brand-600" aria-hidden="true" />{c.name}
                      </button>
                      {c.description && <p className="mt-0.5 text-sm text-muted sm:hidden">{c.description}</p>}
                    </td>
                    <td className="hidden max-w-[360px] px-4 py-3 text-sm text-muted sm:table-cell">{c.description || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <button type="button" onClick={() => { setView('services'); changeQuery(''); changeCategoryFilter(c.id); }}
                        className="font-semibold text-brand-600 hover:underline" aria-label={`Show ${serviceCount[c.id] || 0} services in ${c.name}`}>
                        {serviceCount[c.id] || 0}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {/* <button type="button" onClick={() => setCategoryModal({ id: c.id })} aria-label={`Edit ${c.name}`} className={iconBtn}><FiEdit2 size={16} /></button>
                        <button type="button" onClick={() => setConfirm({ kind: 'category', id: c.id })} aria-label={`Delete ${c.name}`} className={cx(iconBtn, 'hover:text-red-600')}><FiTrash2 size={16} /></button> */}
                     <RowActionsMenu
                        label={c.name}
                        onEdit={() => setCategoryModal({ id: c.id })}
                        onDelete={() => setConfirm({ kind: 'category', id: c.id })}
                      />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            <Pagination {...categoryPaging} label="categories" />
          </div>
        )
      )}

      {/* ---------------- Overlays ---------------- */}
      {drawer && (
        <ServiceDrawer
          key={drawer.id || 'new'}
          service={editingService}
          categories={categories}
          nameTaken={serviceNameTaken}
          categoryNameTaken={serviceCategoryNameTaken}
          onClose={() => setDrawer(null)}
          onSave={saveService}
          onCreateCategory={createCategory}
        />
      )}

      {categoryModal && (
        <CategoryModal
          key={categoryModal.id || 'new'}
          category={editingCategory}
          nameTaken={serviceCategoryNameTaken}
          onClose={() => setCategoryModal(null)}
          onSave={saveCategory}
        />
      )}

      {confirm && confirmTarget && (
        <ConfirmDialog
          title={confirm.kind === 'service' ? 'Delete service?' : 'Delete category?'}
          message={confirm.kind === 'service'
            ? `${confirmTarget.name} will be removed from your services list.`
            : serviceCount[confirm.id]
              ? `${confirmTarget.name} will be deleted. Its ${serviceCount[confirm.id]} service${serviceCount[confirm.id] > 1 ? 's' : ''} will stay, with no category.`
              : `${confirmTarget.name} will be deleted.`}
          confirmLabel={confirm.kind === 'service' ? 'Delete service' : 'Delete category'}
          onCancel={() => setConfirm(null)}
          onConfirm={confirmDelete}
        />
      )}

      {toast && <div role="status" className="fixed left-1/2 top-6 z-[70] -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white shadow-pop">{toast}</div>}
    </div>
  );
}

function CategoryPill({ category }) {
  if (!category) return <span className="text-sm text-muted">No category</span>;
  return <span className="inline-flex items-center rounded-full bg-brand-600/10 px-2.5 py-0.5 text-sm font-semibold text-brand-600">{category.name}</span>;
}

function EmptyState({ title, text, action }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
      <p className="text-lg font-bold text-ink">{title}</p>
      <p className="mt-1 max-w-[48ch] text-muted">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}