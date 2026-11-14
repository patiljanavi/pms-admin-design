// import { useState } from 'react';
// import { Bell, ListChecks, MessageSquarePlus, Plus, Trash2 } from 'lucide-react';
// import MultiSelect from '../MultiSelect';
// import ShortcodeTextField from '../ShortcodeTextField';
// import TextEditor from '../TextEditor';
// import { Avatar, CloseButton, Drawer, Toggle, initials } from '../ui';
// import { Button } from '../ui/button';
// import { Input } from '../ui/input';
// import { Label } from '../ui/label';
// import { useData } from '../../context/DataContext';
// import { contactShortcuts } from '../../data/shortcodes';
// import { newTask } from '../../data/accountChats';
// import { cn } from 'lib/utils';

// /** One section of the drawer form: heading on top, fields below. */
// function Section({ title, description, action, children, className }) {
//   return (
//     <section className={cn('flex flex-col gap-3 py-5 first:pt-0 last:pb-0', className)}>
//       {(title || action) && (
//         <div className="flex items-start justify-between gap-3">
//           <div>
//             {title && <h3 className="text-sm font-semibold">{title}</h3>}
//             {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
//           </div>
//           {action}
//         </div>
//       )}
//       {children}
//     </section>
//   );
// }

// /**
//  * New Chat drawer. Fields: Account * (one or more) · Template · Subject * · Description · Reminders · Client tasks.
//  * Props: defaultAccountIds · onCreate(accountIds, form) · onClose()
//  */
// export default function NewChatDrawer({ defaultAccountIds = [], onCreate, onClose }) {
//   const { accounts = [], chatTemplates = [] } = useData();
//   const [form, setForm] = useState({ accountIds: defaultAccountIds, templateId: '', subject: '', description: '', sendReminders: false, days: 3, count: 2, tasks: [] });
//   const [errors, setErrors] = useState({});
//   const set = (changes) => { setForm((f) => ({ ...f, ...changes })); setErrors((e) => { const n = { ...e }; Object.keys(changes).forEach((k) => delete n[k]); return n; }); };
//   const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name, meta: a.company }));

//   // Picking a template fills subject, description, reminders and tasks
//   const handleTemplateChange = (id) => {
//     const t = chatTemplates.find((x) => x.id === id);
//     if (!t) { set({ templateId: '' }); return; }
//     set({
//       templateId: t.id,
//       subject: t.inputText || '',
//       description: t.description || '',
//       sendReminders: !!t.sendReminders,
//       days: t.daysuntilNextReminder || 3,
//       count: t.noOfReminder || 2,
//       tasks: t.SubtaskSwitch ? (t.subtasks || []).map((s) => newTask(s.text)) : [],
//     });
//   };

//   const saveChat = () => {
//     const e = {};
//     if (!form.accountIds.length) e.accountIds = 'Choose at least one account.';
//     if (!form.subject.trim()) e.subject = 'Subject is required.';
//     if (form.sendReminders && (!(Number(form.days) >= 1) || !(Number(form.count) >= 1))) e.reminders = 'Enter at least 1 day and 1 reminder.';
//     setErrors(e);
//     if (Object.keys(e).length) return;
//     onCreate(form.accountIds, form);
//   };

//   return (
//     <Drawer onClose={onClose} label="New Chat" width="max-w-[650px]">
//       <div className="flex min-h-0 flex-1 flex-col">
//         {/* Header */}
//         <header className="flex flex-none items-start gap-3 border-b px-6 py-4">
//           <span className="mt-0.5 inline-flex size-9 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground" aria-hidden="true"><MessageSquarePlus className="size-4" /></span>
//           <div className="min-w-0 flex-1">
//             <h2 className="text-lg font-semibold tracking-tight">New chat</h2>
//             <p className="text-sm text-muted-foreground">Start a client conversation, with optional reminders and tasks.</p>
//           </div>
//           <CloseButton onClick={onClose} className="-mr-2" />
//         </header>

//         {/* Body */}
//         <div className="min-h-0 flex-1 divide-y overflow-y-auto px-6 py-5">
//           <Section>
//             <MultiSelect label="Account *" placeholder="Select accounts" options={accountOptions} value={form.accountIds} onChange={(v) => set({ accountIds: v })} error={errors.accountIds}
//               renderOption={(o) => <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" /><span><span className="block font-medium">{o.label}</span><span className="block text-xs text-muted-foreground">{o.meta}</span></span></span>} />
//             {form.accountIds.length > 1 && <p className="-mt-1 text-xs text-muted-foreground">A separate chat is created for each account.</p>}

//             <div className="flex flex-col gap-1.5">
//               <Label htmlFor="new-chat-template">Template</Label>
//               <select id="new-chat-template" className="input" value={form.templateId} onChange={(e) => handleTemplateChange(e.target.value)}>
//                 <option value="">Select a template</option>
//                 {chatTemplates.map((t) => <option key={t.id} value={t.id}>{t.templateName}</option>)}
//               </select>
//               <span className="text-xs text-muted-foreground">Fills in the subject, description, reminders and tasks.</span>
//             </div>
//           </Section>

//           <Section title="Message">
//             <div>
//               <ShortcodeTextField label="Subject" required value={form.subject} onChange={(v) => set({ subject: v })} placeholder="e.g. A few receipts are missing, [FIRST_NAME]"
//                 shortcuts={contactShortcuts} error={errors.subject} />
//               <p className="mt-1.5 text-xs text-muted-foreground">Shortcodes are filled in for each account when the chat is created.</p>
//             </div>
//             <div>
//               <span className="mb-1.5 block text-sm font-medium">Description</span>
//               <TextEditor key={form.templateId || 'blank'} ariaLabel="Chat description" value={form.description} onChange={(html) => set({ description: html })}
//                 shortcuts={contactShortcuts} placeholder="The first message the client sees…" minHeight={150} />
//             </div>
//           </Section>

//           <Section>
//             <div className="flex items-start justify-between gap-4">
//               <div className="flex items-start gap-3">
//                 <Bell className="mt-0.5 size-4 flex-none text-muted-foreground" aria-hidden="true" />
//                 <div>
//                   <div className="text-sm font-semibold">Send reminders to client</div>
//                   <p className="text-xs text-muted-foreground">Nudge the client by email until they reply.</p>
//                 </div>
//               </div>
//               <Toggle label="Send reminders to client" checked={form.sendReminders} onChange={(v) => set({ sendReminders: v })} />
//             </div>
//             {form.sendReminders && (
//               <div className="grid grid-cols-1 gap-4 rounded-lg border bg-subtle p-4 sm:grid-cols-2">
//                 <div className="flex flex-col gap-1.5">
//                   <Label htmlFor="new-chat-days">Days until next reminder</Label>
//                   <Input id="new-chat-days" type="number" min="1" aria-invalid={!!errors.reminders} value={form.days} onChange={(e) => set({ days: e.target.value, reminders: undefined })} />
//                 </div>
//                 <div className="flex flex-col gap-1.5">
//                   <Label htmlFor="new-chat-count">Number of reminders</Label>
//                   <Input id="new-chat-count" type="number" min="1" aria-invalid={!!errors.reminders} value={form.count} onChange={(e) => set({ count: e.target.value, reminders: undefined })} />
//                 </div>
//                 {errors.reminders && <p role="alert" className="text-xs text-danger-700 sm:col-span-2">{errors.reminders}</p>}
//               </div>
//             )}
//           </Section>

//           <Section title="Client tasks" description="A checklist the client ticks off inside the chat."
//             action={<Button type="button" variant="outline" size="sm" onClick={() => set({ tasks: [...form.tasks, newTask()] })}><Plus />Add task</Button>}>
//             {form.tasks.length > 0 ? (
//               <ul className="flex flex-col gap-2">
//                 {form.tasks.map((t, i) => (
//                   <li key={t.id} className="group flex items-center gap-2.5">
//                     <span className="size-4 flex-none rounded-[4px] border border-line-strong bg-card" role="img" aria-label={`Task ${i + 1} (client ticks it off)`} />
//                     <Input className="h-8 flex-1" value={t.text} placeholder="Enter task description" aria-label={`Task ${i + 1}`}
//                       onChange={(e) => set({ tasks: form.tasks.map((x) => (x.id === t.id ? { ...x, text: e.target.value } : x)) })} />
//                     <Button type="button" variant="ghost" size="icon-sm" onClick={() => set({ tasks: form.tasks.filter((x) => x.id !== t.id) })} aria-label={`Remove task ${i + 1}`}
//                       className="text-muted-foreground hover:bg-danger-50 hover:text-danger-700"><Trash2 /></Button>
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed px-4 py-6 text-center">
//                 <ListChecks className="size-5 text-muted-foreground" aria-hidden="true" />
//                 <p className="text-sm text-muted-foreground">No tasks added yet. Click “Add task” to create one.</p>
//               </div>
//             )}
//           </Section>
//         </div>

//         {/* Footer */}
//         <footer className="flex flex-none items-center justify-end gap-2 border-t bg-subtle px-6 py-3.5">
//           <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
//           <Button type="button" onClick={saveChat}><Plus />Create chat</Button>
//         </footer>
//       </div>
//     </Drawer>
//   );
// }
import { Fragment, useEffect, useState } from 'react';
import { Bell, ListChecks, MessageSquarePlus, Plus, Trash2 } from 'lucide-react';
import MultiSelect from '../MultiSelect';
import ShortcodeTextField from '../ShortcodeTextField';
import TextEditor from '../TextEditor';
import { Avatar, CloseButton, Drawer, initials } from '../ui';
// shadcn components
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '../ui/select';
import { ToastBridge } from '../ui/sonner';
import { useData } from '../../context/DataContext';
import { contactShortcuts } from '../../data/shortcodes';
import { newTask } from '../../data/accountChats';
import { cn } from 'lib/utils';

const NONE = '__none';

/** One section of the drawer form: heading on top, fields below. */
function Section({ title, description, action, children, className }) {
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-sm font-semibold">{title}</h3>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * New Chat drawer (shadcn). Fields: Account * (one or more) · Template · Subject * · Description · Reminders · Client tasks.
 * Props: defaultAccountIds · onCreate(accountIds, form) · onClose()
 * Messages (ToastBridge, like the template forms): "Please fix the highlighted fields." · "Chat created" / "Created N chats".
 * The toast is shown first, then onCreate runs (it may close the drawer).
 */
export default function NewChatDrawer({ defaultAccountIds = [], onCreate, onClose }) {
  const { accounts = [], chatTemplates = [] } = useData();
  const [form, setForm] = useState({ accountIds: defaultAccountIds, templateId: '', subject: '', description: '', sendReminders: false, days: 3, count: 2, tasks: [] });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState('');
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  // after Create: show the toast, then hand the chat to onCreate on the next render (ToastBridge's effect runs first)
  const [submitted, setSubmitted] = useState(null);
  useEffect(() => { if (submitted) onCreate?.(submitted.accountIds, submitted); }, [submitted]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (changes) => { setForm((f) => ({ ...f, ...changes })); setErrors((e) => { const n = { ...e }; Object.keys(changes).forEach((k) => delete n[k]); return n; }); };
  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name, meta: a.company }));

  // Picking a template fills subject, description, reminders and tasks
  const handleTemplateChange = (id) => {
    const t = chatTemplates.find((x) => x.id === id);
    if (!t) { set({ templateId: '' }); return; }
    set({
      templateId: t.id,
      subject: t.inputText || '',
      description: t.description || '',
      sendReminders: !!t.sendReminders,
      days: t.daysuntilNextReminder || 3,
      count: t.noOfReminder || 2,
      tasks: t.SubtaskSwitch ? (t.subtasks || []).map((s) => newTask(s.text)) : [],
    });
  };

  const saveChat = () => {
    if (submitted) return;                                             // already created (double click)
    const e = {};
    if (!form.accountIds.length) e.accountIds = 'Choose at least one account.';
    if (!form.subject.trim()) e.subject = 'Subject is required.';
    if (form.sendReminders && (!(Number(form.days) >= 1) || !(Number(form.count) >= 1))) e.reminders = 'Enter at least 1 day and 1 reminder.';
    setErrors(e);
    if (Object.keys(e).length) { notify('Please fix the highlighted fields.'); return; }
    notify(form.accountIds.length > 1 ? `Created ${form.accountIds.length} chats` : 'Chat created');
    setSubmitted(form);
  };

  const sections = [
    /* Account · Template */
    <Section key="who">
      <MultiSelect label="Account *" placeholder="Select accounts" options={accountOptions} value={form.accountIds} onChange={(v) => set({ accountIds: v })} error={errors.accountIds}
        renderOption={(o) => <span className="flex flex-1 items-center gap-2.5"><Avatar text={initials(o.label)} size="sm" /><span><span className="block font-medium">{o.label}</span><span className="block text-xs text-muted-foreground">{o.meta}</span></span></span>} />
      {form.accountIds.length > 1 && <p className="-mt-1 text-xs text-muted-foreground">A separate chat is created for each account.</p>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-chat-template">Template</Label>
        <Select value={form.templateId || NONE} onValueChange={(v) => handleTemplateChange(v === NONE ? '' : v)}>
          <SelectTrigger id="new-chat-template" aria-label="Template"><SelectValue placeholder="Select a template" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>No template</SelectItem>
            {chatTemplates.length > 0 && <SelectSeparator />}
            {chatTemplates.map((t) => <SelectItem key={t.id} value={t.id}>{t.templateName}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">Fills in the subject, description, reminders and tasks.</span>
      </div>
    </Section>,

    /* Message */
    <Section key="message" title="Message">
      <div>
        <ShortcodeTextField label="Subject" required value={form.subject} onChange={(v) => set({ subject: v })} placeholder="e.g. A few receipts are missing, [FIRST_NAME]"
          shortcuts={contactShortcuts} error={errors.subject} />
        <p className="mt-1.5 text-xs text-muted-foreground">Shortcodes are filled in for each account when the chat is created.</p>
      </div>
      <div>
        <span className="mb-1.5 block text-sm font-medium">Description</span>
        <TextEditor key={form.templateId || 'blank'} ariaLabel="Chat description" value={form.description} onChange={(html) => set({ description: html })}
          shortcuts={contactShortcuts} placeholder="The first message the client sees…" minHeight={150} />
      </div>
    </Section>,

    /* Reminders */
    <Section key="reminders">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 size-4 flex-none text-muted-foreground" aria-hidden="true" />
          <div>
            <Label htmlFor="new-chat-reminders" className="text-sm font-semibold">Send reminders to client</Label>
            <p className="text-xs text-muted-foreground">Nudge the client by email until they reply.</p>
          </div>
        </div>
        <Switch id="new-chat-reminders" aria-label="Send reminders to client" checked={form.sendReminders} onCheckedChange={(v) => set({ sendReminders: v })} />
      </div>
      {form.sendReminders && (
        <div className="grid grid-cols-1 gap-4 rounded-lg border bg-subtle p-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-chat-days">Days until next reminder</Label>
            <Input id="new-chat-days" type="number" min="1" aria-invalid={!!errors.reminders} value={form.days} onChange={(e) => set({ days: e.target.value, reminders: undefined })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-chat-count">Number of reminders</Label>
            <Input id="new-chat-count" type="number" min="1" aria-invalid={!!errors.reminders} value={form.count} onChange={(e) => set({ count: e.target.value, reminders: undefined })} />
          </div>
          {errors.reminders && <p role="alert" className="text-xs text-destructive sm:col-span-2">{errors.reminders}</p>}
        </div>
      )}
    </Section>,

    /* Client tasks */
    <Section key="tasks" title="Client tasks" description="A checklist the client ticks off inside the chat."
      action={<Button type="button" variant="outline" size="sm" onClick={() => set({ tasks: [...form.tasks, newTask()] })}><Plus />Add task</Button>}>
      {form.tasks.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {form.tasks.map((t, i) => (
            <li key={t.id} className="group flex items-center gap-2.5">
              <span className="size-4 flex-none rounded-[4px] border border-input bg-card" role="img" aria-label={`Task ${i + 1} (client ticks it off)`} />
              <Input className="h-8 flex-1" value={t.text} placeholder="Enter task description" aria-label={`Task ${i + 1}`}
                onChange={(e) => set({ tasks: form.tasks.map((x) => (x.id === t.id ? { ...x, text: e.target.value } : x)) })} />
              <Button type="button" variant="ghost" size="icon" onClick={() => set({ tasks: form.tasks.filter((x) => x.id !== t.id) })} aria-label={`Remove task ${i + 1}`}
                className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 /></Button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed px-4 py-6 text-center">
          <ListChecks className="size-5 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No tasks added yet. Click “Add task” to create one.</p>
        </div>
      )}
    </Section>,
  ];

  return (
    <Drawer onClose={onClose} label="New Chat" width="max-w-[650px]">
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex flex-none items-start gap-3 border-b px-6 py-4">
          <span className="mt-0.5 inline-flex size-9 flex-none items-center justify-center rounded-lg border bg-subtle text-muted-foreground" aria-hidden="true"><MessageSquarePlus className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight">New chat</h2>
            <p className="text-sm text-muted-foreground">Start a client conversation, with optional reminders and tasks.</p>
          </div>
          <CloseButton onClick={onClose} className="-mr-2" />
        </header>

        {/* Body: sections with shadcn Separators between them */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {sections.map((s, i) => (
            <Fragment key={s.key}>
              {i > 0 && <Separator className="my-5" />}
              {s}
            </Fragment>
          ))}
        </div>

        {/* Footer */}
        <footer className="flex flex-none items-center justify-end gap-2 border-t bg-subtle px-6 py-3.5">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={saveChat} disabled={!!submitted}><Plus />Create chat</Button>
        </footer>
      </div>
      <ToastBridge message={toast} />
    </Drawer>
  );
}