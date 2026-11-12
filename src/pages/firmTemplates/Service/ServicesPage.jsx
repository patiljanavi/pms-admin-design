import { useMemo, useRef, useState } from 'react';
import {
  CircleDollarSign, Clock, Folder, FolderPlus, Layers, Package, Plus, Receipt, SearchX, Trash2, X,
} from 'lucide-react';
import { RATE_SUFFIX, RATE_TYPES } from '../../../data/servicesData';
import Pagination, { usePagination } from '../../../components/Pagination';
import { useData } from '../../../context/DataContext';
import RowActionsMenu from '../../../components/RowActionsMenu';
import { DataCard, EmptyState, PageHeader, SearchInput, StatCard } from '../../../components/page';
import { CloseButton, Drawer, Modal, Segmented } from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { Textarea } from '../../../components/ui/textarea';
import { SimpleTooltip } from '../../../components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { toast } from '../../../components/ui/sonner';
import { cn } from 'lib/utils';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const notify = (m) => (/delet|remov/i.test(m) ? toast(m) : toast.success(m));

/** Price with the amount emphasised and the "/hr" suffix muted; numbers line up (tabular-nums). */
function Rate({ rate, type, className }) {
  if (rate === '' || rate == null) return <span className="text-muted-foreground/60">—</span>;
  return (
    <span className={cn('whitespace-nowrap tabular-nums', className)}>
      <span className="font-medium text-foreground">{money.format(Number(rate))}</span>
      {RATE_SUFFIX[type] && <span className="text-muted-foreground">{RATE_SUFFIX[type]}</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Category modal (create + edit)                                      */
/* ------------------------------------------------------------------ */

function CategoryModal({ category, nameTaken, onClose, onSave }) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [error, setError] = useState('');

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return setError('Enter a category name.');
    if (nameTaken(trimmed, category?.id)) return setError('A category with this name already exists.');
    onSave({ name: trimmed, description: description.trim() });
  };

  return (
    <Modal title={category ? 'Edit category' : 'New category'} description="Group related services so they're easier to find." onClose={onClose} width="max-w-md"
      footer={<>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="category-form">{category ? 'Save changes' : 'Create category'}</Button>
      </>}>
      <form id="category-form" className="flex flex-col gap-4" noValidate onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); save(); }}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category-name">Category name <span className="text-danger-700">*</span></Label>
          <Input id="category-name" autoFocus value={name} placeholder="e.g. Tax Preparation"
            onChange={(e) => { setName(e.target.value); setError(''); }}
            aria-invalid={!!error} aria-describedby={error ? 'category-name-error' : undefined} />
          {error && <p id="category-name-error" className="text-xs text-danger-700">{error}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category-description">Description</Label>
          <Textarea id="category-description" rows={3} value={description} placeholder="What kind of services go here?"
            onChange={(e) => setDescription(e.target.value)} className="resize-none" />
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Service drawer (create + edit share this one drawer)                */
/* ------------------------------------------------------------------ */

const NEW_CATEGORY = '__new__';
const NO_CATEGORY = '__none__';

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

  const handleCategoryChange = (value) => {
    if (value === NEW_CATEGORY) return setCategoryModalOpen(true); // keep the old value until a category is created
    set('categoryId')(value === NO_CATEGORY ? '' : value);
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
    <Drawer onClose={onClose} label={service ? 'Edit service' : 'New service'} width="max-w-[560px]">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-none items-start gap-3 border-b px-6 py-4">
          <span className="mt-0.5 inline-flex size-9 flex-none items-center justify-center rounded-lg border border-brand-100 bg-brand-50 text-brand-700" aria-hidden="true"><Package className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <h2 id="service-drawer-title" className="truncate text-lg font-semibold tracking-tight">{service ? 'Edit service' : 'New service'}</h2>
            <p className="truncate text-sm text-muted-foreground">{service ? service.name : 'A billable service you can reuse on invoices and proposals.'}</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <form id="service-form" noValidate className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="service-name">Service name <span className="text-danger-700">*</span></Label>
            <Input id="service-name" ref={nameRef} autoFocus type="text" placeholder="e.g. Monthly Bookkeeping" value={form.name}
              onChange={(e) => { set('name')(e.target.value); setError(''); }}
              aria-invalid={!!error} aria-describedby={error ? 'service-name-error' : undefined} />
            {error && <p id="service-name-error" className="text-xs text-danger-700">{error}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="service-description">Description</Label>
            <Textarea id="service-description" rows={3} placeholder="What’s included in this service?" value={form.description}
              onChange={(e) => set('description')(e.target.value)} className="resize-none" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="service-rate">Rate</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden="true">$</span>
                <Input id="service-rate" type="text" inputMode="decimal" placeholder="0.00" value={form.rate}
                  onChange={handleRateChange} onBlur={formatRateOnBlur} className="pl-7 tabular-nums" />
                {RATE_SUFFIX[form.rateType] && (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden="true">{RATE_SUFFIX[form.rateType]}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="service-rate-type">Rate type</Label>
              <Select value={form.rateType} onValueChange={set('rateType')}>
                <SelectTrigger id="service-rate-type"><SelectValue placeholder="Select rate type" /></SelectTrigger>
                <SelectContent>
                  {RATE_TYPES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border bg-subtle/60 px-4 py-3">
            <Label htmlFor="service-tax" className="flex cursor-pointer flex-col gap-1 leading-snug">
              <span id="service-tax-label">Taxable</span>
              <span className="text-xs font-normal text-muted-foreground">Add sales tax when this service is invoiced.</span>
            </Label>
            <Switch id="service-tax" aria-label="Taxable" checked={!!form.tax} onCheckedChange={set('tax')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="service-category">Category</Label>
            <Select value={form.categoryId || NO_CATEGORY} onValueChange={handleCategoryChange}>
              <SelectTrigger id="service-category"><SelectValue placeholder="No category" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value={NO_CATEGORY} className="text-muted-foreground">No category</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                <SelectSeparator />
                <SelectItem value={NEW_CATEGORY} className="font-medium text-primary focus:text-primary">+ Add new category</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>

        <div className="flex flex-none items-center justify-end gap-2 border-t bg-subtle px-6 py-3.5">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="service-form">{service ? 'Save changes' : 'Create service'}</Button>
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
    </Drawer>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function CategoryPill({ category }) {
  if (!category) return <span className="text-sm text-muted-foreground/70">No category</span>;
  return <Badge variant="outline" className="max-w-[200px] font-normal"><Folder className="text-muted-foreground" aria-hidden="true" /><span className="truncate">{category.name}</span></Badge>;
}

function TaxBadge({ tax }) {
  return tax ? <Badge variant="success" dot>Taxable</Badge> : <span className="text-sm text-muted-foreground/70">No</span>;
}

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
    <RowActionsMenu
      label={s.name}
      onEdit={() => setDrawer({ id: s.id })}
      onDuplicate={() => duplicateService(s)}
      onDelete={() => setConfirm({ kind: 'service', id: s.id })}
    />
  );

  const hourly = services.filter((s) => s.rateType === 'hour').length;
  const taxable = services.filter((s) => s.tax).length;
  const priced = services.filter((s) => s.rate !== '' && s.rate != null && !Number.isNaN(Number(s.rate)));
  const avgRate = priced.length ? priced.reduce((n, s) => n + Number(s.rate), 0) / priced.length : 0;
  const filtersOn = !!(query || (view === 'services' && categoryFilter !== 'all'));
  const resetFilters = () => { changeQuery(''); changeCategoryFilter('all'); };
  const filterLabel = categoryFilter === 'all' ? null : categoryFilter === 'none' ? 'No category' : categoryById[categoryFilter]?.name;

  return (
    <div className="page">
      <PageHeader
        title="Services"
        description="The services your firm offers, with rates you can add to invoices and proposals."
        actions={(
          <Button onClick={() => (view === 'services' ? setDrawer({ id: null }) : setCategoryModal({ id: null }))}>
            {view === 'services' ? <Plus /> : <FolderPlus />}
            {view === 'services' ? 'New service' : 'New category'}
          </Button>
        )}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Services" value={services.length} icon={Package} hint={`${services.length - hourly} flat · ${hourly} hourly`} />
        <StatCard label="Categories" value={categories.length} icon={Layers}
          hint={`${services.filter((s) => !s.categoryId).length} uncategorised`}
          onClick={() => { setView('categories'); changeQuery(''); }} active={view === 'categories'} />
        <StatCard label="Average rate" value={money.format(avgRate)} icon={CircleDollarSign} hint="across priced services" />
        <StatCard label="Taxable" value={taxable} icon={Receipt} hint={`${Math.round((taxable / Math.max(services.length, 1)) * 100)}% of services`} />
      </div>

      <DataCard
        toolbar={<>
          <Segmented size="sm" label="Show" value={view}
            onChange={(v) => { setView(v); changeQuery(''); }}
            options={[
              { value: 'services', label: <>Services <span className="tabular-nums text-muted-foreground">{services.length}</span></> },
              { value: 'categories', label: <>Categories <span className="tabular-nums text-muted-foreground">{categories.length}</span></> },
            ]} />
          <SearchInput value={query} onChange={changeQuery} label={`Search ${view}`}
            placeholder={view === 'services' ? 'Search services' : 'Search categories'} className="h-8 w-full sm:w-64" />
          {view === 'services' && (
            <Select value={categoryFilter} onValueChange={changeCategoryFilter}>
              <SelectTrigger aria-label="Filter by category" className={cn('h-8 w-auto min-w-[160px] max-w-[220px] gap-1.5', categoryFilter !== 'all' && 'border-line-strong')}>
                <Folder className="size-3.5 flex-none text-muted-foreground" aria-hidden="true" /><SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value="all">All categories</SelectItem>
                <SelectSeparator />
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                <SelectSeparator />
                <SelectItem value="none">No category</SelectItem>
              </SelectContent>
            </Select>
          )}
          {filtersOn && <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">Reset<X /></Button>}
          <span className="ml-auto hidden text-sm tabular-nums text-muted-foreground md:inline">
            {view === 'services' ? `${visibleServices.length} of ${services.length}` : `${visibleCategories.length} of ${categories.length}`}
          </span>
        </>}
        footer={view === 'services'
          ? visibleServices.length > 0 && <Pagination {...servicePaging} label="services" />
          : visibleCategories.length > 0 && <Pagination {...categoryPaging} label="categories" />}
      >
        {/* ---------------- Services list ---------------- */}
        {view === 'services' && (
          visibleServices.length === 0 ? (
            services.length ? (
              <EmptyState icon={SearchX} title="No services match your search"
                description={filterLabel ? `Nothing in “${filterLabel}” matches. Try a different name or category.` : 'Try a different name or category.'}
                action={<Button variant="outline" onClick={resetFilters}>Clear filters</Button>} />
            ) : (
              <EmptyState icon={Package} title="No services yet" description="Add the services your firm offers so you can reuse them on invoices and proposals."
                action={<Button onClick={() => setDrawer({ id: null })}><Plus />New service</Button>} />
            )
          ) : (
            <>
              {/* Tablet & desktop: table */}
              <div className="hidden md:block">
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead>Tax</TableHead>
                      <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servicePaging.pageItems.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="max-w-[380px]">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex size-8 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground" aria-hidden="true">
                              {s.rateType === 'hour' ? <Clock className="size-4" /> : <Package className="size-4" />}
                            </span>
                            <div className="min-w-0">
                              <button type="button" onClick={() => setDrawer({ id: s.id })}
                                className="block max-w-full truncate text-left font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none">{s.name}</button>
                              {s.description && (
                                <SimpleTooltip label={s.description.length > 60 ? s.description : null}>
                                  <p className="truncate text-xs text-muted-foreground">{s.description}</p>
                                </SimpleTooltip>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><CategoryPill category={categoryById[s.categoryId]} /></TableCell>
                        <TableCell className="text-right"><Rate rate={s.rate} type={s.rateType} /></TableCell>
                        <TableCell><TaxBadge tax={s.tax} /></TableCell>
                        <TableCell className="text-right">{serviceActions(s)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Phones: list rows */}
              <ul className="divide-y md:hidden">
                {servicePaging.pageItems.map((s) => (
                  <li key={s.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <button type="button" onClick={() => setDrawer({ id: s.id })} className="min-w-0 text-left font-medium text-foreground hover:underline">{s.name}</button>
                      <Rate rate={s.rate} type={s.rateType} className="text-sm" />
                    </div>
                    {s.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>}
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CategoryPill category={categoryById[s.categoryId]} />
                        {s.tax && <TaxBadge tax />}
                      </div>
                      {serviceActions(s)}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )
        )}

        {/* ---------------- Categories list ---------------- */}
        {view === 'categories' && (
          visibleCategories.length === 0 ? (
            categories.length ? (
              <EmptyState icon={SearchX} title="No categories match your search" description="Try a different name."
                action={<Button variant="outline" onClick={() => changeQuery('')}>Clear search</Button>} />
            ) : (
              <EmptyState icon={Folder} title="No categories yet" description="Group your services into categories to keep the list tidy."
                action={<Button onClick={() => setCategoryModal({ id: null })}><FolderPlus />New category</Button>} />
            )
          ) : (
            <Table className="min-w-[520px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden sm:table-cell">Description</TableHead>
                  <TableHead className="text-right">Services</TableHead>
                  <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryPaging.pageItems.map((c) => {
                  const n = serviceCount[c.id] || 0;
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <button type="button" onClick={() => setCategoryModal({ id: c.id })}
                          className="flex items-center gap-2.5 text-left font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none">
                          <span className="inline-flex size-7 flex-none items-center justify-center rounded-md border bg-subtle text-muted-foreground" aria-hidden="true"><Folder className="size-3.5" /></span>
                          {c.name}
                        </button>
                        {c.description && <p className="mt-0.5 pl-[2.375rem] text-xs text-muted-foreground sm:hidden">{c.description}</p>}
                      </TableCell>
                      <TableCell className="hidden max-w-[380px] truncate text-sm text-muted-foreground sm:table-cell">{c.description || <span className="text-muted-foreground/60">—</span>}</TableCell>
                      <TableCell className="text-right">
                        <SimpleTooltip label={n ? `Show ${n} service${n > 1 ? 's' : ''}` : 'No services yet'}>
                          <button type="button" onClick={() => { setView('services'); changeQuery(''); changeCategoryFilter(c.id); }}
                            className={cn('inline-flex h-6 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-medium tabular-nums transition-colors hover:border-primary/40 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                              n ? 'bg-card text-foreground' : 'bg-muted text-muted-foreground')}
                            aria-label={`Show ${n} services in ${c.name}`}>
                            {n}
                          </button>
                        </SimpleTooltip>
                      </TableCell>
                      <TableCell className="text-right">
                        <RowActionsMenu
                          label={c.name}
                          onEdit={() => setCategoryModal({ id: c.id })}
                          onDelete={() => setConfirm({ kind: 'category', id: c.id })}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )
        )}
      </DataCard>

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
        <Modal title={confirm.kind === 'service' ? 'Delete service?' : 'Delete category?'} width="max-w-md" onClose={() => setConfirm(null)}
          footer={<>
            <Button variant="outline" autoFocus onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}><Trash2 />{confirm.kind === 'service' ? 'Delete service' : 'Delete category'}</Button>
          </>}>
          <p className="text-sm text-muted-foreground">
            {confirm.kind === 'service'
              ? `${confirmTarget.name} will be removed from your services list.`
              : serviceCount[confirm.id]
                ? `${confirmTarget.name} will be deleted. Its ${serviceCount[confirm.id]} service${serviceCount[confirm.id] > 1 ? 's' : ''} will stay, with no category.`
                : `${confirmTarget.name} will be deleted.`}
          </p>
        </Modal>
      )}
    </div>
  );
}
