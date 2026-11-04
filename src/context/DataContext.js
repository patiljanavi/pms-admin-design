// // import { createContext, useCallback, useContext, useMemo, useState } from 'react';
// // import { DEFAULT_TAGS, seedAccounts, seedContacts } from '../data/sampleData';
// // import { seedTaskTemplates } from '../data/taskTemplates';
// // import { seedEmailTemplates } from '../data/emailtemplates';
// // import { seedClientFacingJobs } from '../data/clientFacingJobs';
// // import { seedJobTemplates } from '../data/jobtemplates';

// // /**
// //  * Shared app data: accounts, contacts, tags, task / email / job templates and client-facing jobs (statuses).
// //  * Accounts and contacts store tag ids, so renaming or recolouring a tag updates them instantly.
// //  * Job templates store a client-facing job's `value` in `selectedJob`.
// //  * Replace the useState seeds with API calls when you add a backend.
// //  */
// // const DataContext = createContext(null);

// // const slug = (label) => label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tag';
// // const today = () => new Date().toISOString().slice(0, 10);

// // export function DataProvider({ children }) {
// //   const [accounts, setAccounts] = useState(seedAccounts);
// //   const [tags, setTags] = useState(DEFAULT_TAGS);
// //   const [contacts, setContacts] = useState(seedContacts);
// //   const [taskTemplates, setTaskTemplates] = useState(seedTaskTemplates);
// //   const [emailTemplates, setEmailTemplates] = useState(seedEmailTemplates);
// //   const [clientFacingJobs, setClientFacingJobs] = useState(seedClientFacingJobs);
// //   const [jobTemplates, setJobTemplates] = useState(seedJobTemplates);

// //   const tagById = useMemo(() => new Map(tags.map((t) => [t.value, t])), [tags]);
// //   const tagUsage = useMemo(() => {
// //     const m = new Map();
// //     accounts.forEach((a) => (a.tags || []).forEach((id) => m.set(id, (m.get(id) || 0) + 1)));
// //     return m;
// //   }, [accounts]);

// //   /** Returns true if another tag already has this name. */
// //   const nameTaken = useCallback((label, exceptId) => tags.some((t) => t.value !== exceptId && t.label.trim().toLowerCase() === label.trim().toLowerCase()), [tags]);

// //   /** Create (no id) or update (with id). Returns the tag id. */
// //   const saveTag = useCallback(({ value, label, color, description = '' }) => {
// //     if (value) {
// //       setTags((list) => list.map((t) => (t.value === value ? { ...t, label: label.trim(), color, description } : t)));
// //       return value;
// //     }
// //     let id = slug(label);
// //     const ids = new Set(tags.map((t) => t.value));
// //     let n = 2; while (ids.has(id)) { id = `${slug(label)}-${n}`; n += 1; }
// //     setTags((list) => [...list, { value: id, label: label.trim(), color, description, createdAt: today() }]);
// //     return id;
// //   }, [tags]);

// //   /** Quick create from a multi-select ("Create tag …"). Reuses an existing tag with the same name. */
// //   const createTag = useCallback((label) => {
// //     const existing = tags.find((t) => t.label.toLowerCase() === label.trim().toLowerCase());
// //     return existing ? existing.value : saveTag({ label, color: '#475569' });
// //   }, [tags, saveTag]);

// //   const recolorTags = useCallback((ids, color) => setTags((list) => list.map((t) => (ids.includes(t.value) ? { ...t, color } : t))), []);

// //   /* ---------- Client-facing jobs (statuses shown in the client portal) ---------- */
// //   /** Returns true if another client-facing job already has this name. */
// //   const clientFacingJobNameTaken = useCallback(
// //     (label, exceptId) => clientFacingJobs.some((job) => job.value !== exceptId && job.label.trim().toLowerCase() === label.trim().toLowerCase()),
// //     [clientFacingJobs],
// //   );

// //   /** Create (no value) or update (with value). Returns the value (id). */
// //   const saveClientFacingJob = useCallback(({ value, label, color, description = '' }) => {
// //     const name = label.trim();
// //     if (value) {
// //       setClientFacingJobs((list) => list.map((job) => (job.value === value ? { ...job, label: name, color, description } : job)));
// //       return value;
// //     }
// //     const baseId = slug(name) || 'job';
// //     const existingIds = new Set(clientFacingJobs.map((job) => job.value));
// //     let id = baseId;
// //     let suffix = 2;
// //     while (existingIds.has(id)) { id = `${baseId}-${suffix}`; suffix += 1; }
// //     setClientFacingJobs((list) => [{ value: id, label: name, color, description, createdAt: today() }, ...list]);
// //     return id;
// //   }, [clientFacingJobs]);

// //   /** Quick create; reuses an existing client-facing job with the same name. */
// //   const createClientFacingJob = useCallback((label) => {
// //     const existing = clientFacingJobs.find((job) => job.label.trim().toLowerCase() === label.trim().toLowerCase());
// //     return existing ? existing.value : saveClientFacingJob({ label, color: '#475569' });
// //   }, [clientFacingJobs, saveClientFacingJob]);

// //   /** Update the color of selected client-facing jobs. */
// //   const recolorClientFacingJobs = useCallback((ids, color) => {
// //     setClientFacingJobs((list) => list.map((job) => (ids.includes(job.value) ? { ...job, color } : job)));
// //   }, []);

// //   /** Delete client-facing jobs and clear them from job templates that used them. */
// //   const deleteClientFacingJobs = useCallback((ids) => {
// //     setClientFacingJobs((list) => list.filter((job) => !ids.includes(job.value)));
// //     setJobTemplates((list) => list.map((t) => (ids.includes(t.selectedJob) ? { ...t, selectedJob: null } : t)));
// //   }, []);

// //   /* ---------- Task templates ---------- */
// //   /** Create (no id) or update (with id). Returns the id. */
// //   const saveTaskTemplate = useCallback((tpl) => {
// //     if (tpl.id) {
// //       setTaskTemplates((list) => list.map((t) => (t.id === tpl.id ? { ...t, ...tpl, updatedAt: today() } : t)));
// //       return tpl.id;
// //     }
// //     const id = `tt-${Date.now().toString(36)}`;
// //     setTaskTemplates((list) => [{ ...tpl, id, updatedAt: today() }, ...list]);
// //     return id;
// //   }, []);
// //   const duplicateTaskTemplates = useCallback((ids) => setTaskTemplates((list) => [
// //     ...list.filter((t) => ids.includes(t.id)).map((t, i) => ({ ...JSON.parse(JSON.stringify(t)), id: `tt-${Date.now().toString(36)}-${i}`, templatename: `${t.templatename} (copy)`, updatedAt: today() })),
// //     ...list,
// //   ]), []);
// //   const deleteTaskTemplates = useCallback((ids) => setTaskTemplates((list) => list.filter((t) => !ids.includes(t.id))), []);

// //   /* ---------- Email templates ---------- */
// //   const saveEmailTemplate = useCallback((tpl) => {
// //     if (tpl.id) {
// //       setEmailTemplates((list) => list.map((t) => (t.id === tpl.id ? { ...t, ...tpl, updatedAt: today() } : t)));
// //       return tpl.id;
// //     }
// //     const id = `et-${Date.now().toString(36)}`;
// //     setEmailTemplates((list) => [{ ...tpl, id, updatedAt: today() }, ...list]);
// //     return id;
// //   }, []);
// //   const duplicateEmailTemplates = useCallback((ids) => setEmailTemplates((list) => [
// //     ...list.filter((t) => ids.includes(t.id)).map((t, i) => ({ ...JSON.parse(JSON.stringify(t)), id: `et-${Date.now().toString(36)}-${i}`, templateName: `${t.templateName} (copy)`, updatedAt: today() })),
// //     ...list,
// //   ]), []);
// //   const deleteEmailTemplates = useCallback((ids) => setEmailTemplates((list) => list.filter((t) => !ids.includes(t.id))), []);

// //   /* ---------- Job templates ---------- */
// //   const saveJobTemplate = useCallback((tpl) => {
// //     if (tpl.id) {
// //       setJobTemplates((list) => list.map((t) => (t.id === tpl.id ? { ...t, ...tpl, updatedAt: today() } : t)));
// //       return tpl.id;
// //     }
// //     const id = `jt-${Date.now().toString(36)}`;
// //     setJobTemplates((list) => [{ ...tpl, id, updatedAt: today() }, ...list]);
// //     return id;
// //   }, []);
// //   const duplicateJobTemplates = useCallback((ids) => setJobTemplates((list) => [
// //     ...list.filter((t) => ids.includes(t.id)).map((t, i) => ({ ...JSON.parse(JSON.stringify(t)), id: `jt-${Date.now().toString(36)}-${i}`, templatename: `${t.templatename} (copy)`, updatedAt: today() })),
// //     ...list,
// //   ]), []);
// //   const deleteJobTemplates = useCallback((ids) => setJobTemplates((list) => list.filter((t) => !ids.includes(t.id))), []);

// //   /** Add an account from the Add account drawer's form. Returns the new account. */
// //   const addAccount = useCallback((form) => {
// //     const name = (form.name || '').trim() || 'New account';
// //     const rec = {
// //       id: `AC-${Date.now().toString(36).toUpperCase()}`, name, company: form.company || '',
// //       email: form.email || '', owner: '', team: form.team || [], tags: form.tags || [], contacts: form.contacts || [],
// //       role: form.role || 'Editor', status: form.status || 'Active', plan: form.plan || 'Pro', joined: today(),
// //     };
// //     setAccounts((list) => [rec, ...list]);
// //     return rec;
// //   }, []);

// //   /** Delete tags and remove them from every account and contact. */
// //   const deleteTags = useCallback((ids) => {
// //     setTags((list) => list.filter((t) => !ids.includes(t.value)));
// //     setAccounts((list) => list.map((a) => ({ ...a, tags: (a.tags || []).filter((id) => !ids.includes(id)) })));
// //     setContacts((list) => list.map((c) => ({ ...c, tags: (c.tags || []).filter((id) => !ids.includes(id)) })));
// //   }, []);

// //   /** Create (no id) or update (with id) a contact. Returns the contact id. */
// //   const saveContact = useCallback((contact) => {
// //     if (contact.id) {
// //       setContacts((list) => list.map((c) => (c.id === contact.id ? { ...c, ...contact } : c)));
// //       return contact.id;
// //     }
// //     const id = `CT-${Date.now().toString(36).toUpperCase()}`;
// //     setContacts((list) => [{ ...contact, id, createdAt: today() }, ...list]);
// //     return id;
// //   }, []);
// //   const deleteContacts = useCallback((ids) => setContacts((list) => list.filter((c) => !ids.includes(c.id))), []);

// //   const value = useMemo(() => ({
// //     accounts, setAccounts, tags, tagById, tagUsage, nameTaken, saveTag, createTag, recolorTags, deleteTags,
// //     contacts, setContacts, saveContact, deleteContacts, addAccount,
// //     taskTemplates, saveTaskTemplate, duplicateTaskTemplates, deleteTaskTemplates,
// //     emailTemplates, saveEmailTemplate, duplicateEmailTemplates, deleteEmailTemplates,
// //     clientFacingJobs, setClientFacingJobs, clientFacingJobNameTaken, saveClientFacingJob, createClientFacingJob, recolorClientFacingJobs, deleteClientFacingJobs,
// //     jobTemplates, saveJobTemplate, duplicateJobTemplates, deleteJobTemplates,
// //   }), [accounts, tags, tagById, tagUsage, nameTaken, saveTag, createTag, recolorTags, deleteTags, contacts, saveContact, deleteContacts, addAccount,
// //     taskTemplates, saveTaskTemplate, duplicateTaskTemplates, deleteTaskTemplates,
// //     emailTemplates, saveEmailTemplate, duplicateEmailTemplates, deleteEmailTemplates,
// //     clientFacingJobs, clientFacingJobNameTaken, saveClientFacingJob, createClientFacingJob, recolorClientFacingJobs, deleteClientFacingJobs,
// //     jobTemplates, saveJobTemplate, duplicateJobTemplates, deleteJobTemplates]);

// //   return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
// // }

// // export const useData = () => useContext(DataContext);

// import {
//   createContext,
//   useCallback,
//   useContext,
//   useMemo,
//   useState,
// } from "react";
// import { DEFAULT_TAGS, seedAccounts, seedContacts } from "../data/sampleData";
// import { seedTaskTemplates } from "../data/taskTemplates";
// import { seedEmailTemplates } from "../data/emailtemplates";
// import { seedClientFacingJobs } from "../data/clientFacingJobs";
// import { seedJobTemplates } from "../data/jobtemplates";
// import { SEED_PIPELINES } from "../data/pipelinesdata";
// import { SEED_CATEGORIES, SEED_SERVICES } from "../data/servicesData";
// import { seedChatTemplates } from "../data/chatTemplates";
// import { seedInvoiceTemplates } from "../data/invoiceTemplates";
// import { seedProposalTemplates } from "../data/proposalTemplates";
// import { seedOrganizerTemplates } from "../data/organizerTemplates";
// import { seedFolderTemplates } from "../data/folderTemplates";
// import { seedJobs } from "../data/jobs";
// import { runAutomations } from "../data/automations";
// import { fillShortcodes } from "../data/accountChats";
// /**
//  * Shared app data: accounts, contacts, tags, task / email / job templates, client-facing jobs (statuses),
//  * pipelines, services and service categories.
//  * Accounts and contacts store tag ids, so renaming or recolouring a tag updates them instantly.
//  * Job templates store a client-facing job's `value` in `selectedJob`.
//  * Services store their category's `id` in `categoryId`.
//  * Replace the useState seeds with API calls when you add a backend.
//  */
// const DataContext = createContext(null);

// const slug = (label) =>
//   label
//     .toLowerCase()
//     .trim()
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/^-|-$/g, "") || "tag";
// const today = () => new Date().toISOString().slice(0, 10);
// const uid = (prefix) =>
//   `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
// const sameName = (a = "", b = "") =>
//   a.trim().toLowerCase() === b.trim().toLowerCase();

// /** Returns `${base} (copy)`, `${base} (copy 2)`, … — the first name not already used. */
// const copyName = (base, isTaken) => {
//   let name = `${base} (copy)`;
//   for (let n = 2; isTaken(name); n += 1) name = `${base} (copy ${n})`;
//   return name;
// };

// export function DataProvider({ children }) {
//   const [accounts, setAccounts] = useState(seedAccounts);
//   const [tags, setTags] = useState(DEFAULT_TAGS);
//   const [contacts, setContacts] = useState(seedContacts);
//   const [taskTemplates, setTaskTemplates] = useState(seedTaskTemplates);
//   const [emailTemplates, setEmailTemplates] = useState(seedEmailTemplates);
//   const [clientFacingJobs, setClientFacingJobs] =
//     useState(seedClientFacingJobs);
//   const [jobTemplates, setJobTemplates] = useState(seedJobTemplates);
//   // const [pipelines, setPipelines] = useState(SEED_PIPELINES);
//   const [services, setServices] = useState(SEED_SERVICES);
//   const [serviceCategories, setServiceCategories] = useState(SEED_CATEGORIES);
//   const [chatTemplates, setChatTemplates] = useState(seedChatTemplates);
//   const [invoiceTemplates, setInvoiceTemplates] =
//     useState(seedInvoiceTemplates);
//   const [proposalTemplates, setProposalTemplates] = useState(
//     seedProposalTemplates,
//   );
//   const [organizerTemplates, setOrganizerTemplates] = useState(
//     seedOrganizerTemplates,
//   );
//   const [folderTemplates, setFolderTemplates] = useState(seedFolderTemplates);
//  const [pipelines, setPipelines] = useState(SEED_PIPELINES);
//   const [jobs, setJobs] = useState(seedJobs);

//   const tagById = useMemo(() => new Map(tags.map((t) => [t.value, t])), [tags]);
//   const tagUsage = useMemo(() => {
//     const m = new Map();
//     accounts.forEach((a) =>
//       (a.tags || []).forEach((id) => m.set(id, (m.get(id) || 0) + 1)),
//     );
//     return m;
//   }, [accounts]);

//   /** Returns true if another tag already has this name. */
//   const nameTaken = useCallback(
//     (label, exceptId) =>
//       tags.some(
//         (t) =>
//           t.value !== exceptId &&
//           t.label.trim().toLowerCase() === label.trim().toLowerCase(),
//       ),
//     [tags],
//   );

//   /** Create (no id) or update (with id). Returns the tag id. */
//   const saveTag = useCallback(
//     ({ value, label, color, description = "" }) => {
//       if (value) {
//         setTags((list) =>
//           list.map((t) =>
//             t.value === value
//               ? { ...t, label: label.trim(), color, description }
//               : t,
//           ),
//         );
//         return value;
//       }
//       let id = slug(label);
//       const ids = new Set(tags.map((t) => t.value));
//       let n = 2;
//       while (ids.has(id)) {
//         id = `${slug(label)}-${n}`;
//         n += 1;
//       }
//       setTags((list) => [
//         ...list,
//         {
//           value: id,
//           label: label.trim(),
//           color,
//           description,
//           createdAt: today(),
//         },
//       ]);
//       return id;
//     },
//     [tags],
//   );

//   /** Quick create from a multi-select ("Create tag …"). Reuses an existing tag with the same name. */
//   const createTag = useCallback(
//     (label) => {
//       const existing = tags.find(
//         (t) => t.label.toLowerCase() === label.trim().toLowerCase(),
//       );
//       return existing ? existing.value : saveTag({ label, color: "#475569" });
//     },
//     [tags, saveTag],
//   );

//   const recolorTags = useCallback(
//     (ids, color) =>
//       setTags((list) =>
//         list.map((t) => (ids.includes(t.value) ? { ...t, color } : t)),
//       ),
//     [],
//   );
//   /** Create (no id) or update (with id). Returns the id. */
//   const saveChatTemplate = useCallback((tpl) => {
//     if (tpl.id) {
//       setChatTemplates((list) =>
//         list.map((t) =>
//           t.id === tpl.id ? { ...t, ...tpl, updatedAt: today() } : t,
//         ),
//       );
//       return tpl.id;
//     }
//     const id = uid("ct");
//     setChatTemplates((list) => [{ ...tpl, id, updatedAt: today() }, ...list]);
//     return id;
//   }, []);

//   /** Copy templates with new ids and unique "(copy)" names; copies go to the top. */
//   const duplicateChatTemplates = useCallback(
//     (ids) =>
//       setChatTemplates((list) => {
//         const used = list.map((t) => t.templateName);
//         const copies = list
//           .filter((t) => ids.includes(t.id))
//           .map((t) => {
//             const templateName = copyName(t.templateName, (n) =>
//               used.some((u) => sameName(u, n)),
//             );
//             used.push(templateName);
//             return {
//               ...JSON.parse(JSON.stringify(t)),
//               id: uid("ct"),
//               templateName,
//               updatedAt: today(),
//             };
//           });
//         return [...copies, ...list];
//       }),
//     [],
//   );

//   const deleteChatTemplates = useCallback(
//     (ids) =>
//       setChatTemplates((list) => list.filter((t) => !ids.includes(t.id))),
//     [],
//   );

//   /** Returns true if another chat template already has this name. */
//   const chatTemplateNameTaken = useCallback(
//     (name, exceptId) =>
//       chatTemplates.some(
//         (t) => t.id !== exceptId && sameName(t.templateName, name),
//       ),
//     [chatTemplates],
//   );
//   /* ---------- Client-facing jobs (statuses shown in the client portal) ---------- */
//   /** Returns true if another client-facing job already has this name. */
//   const clientFacingJobNameTaken = useCallback(
//     (label, exceptId) =>
//       clientFacingJobs.some(
//         (job) =>
//           job.value !== exceptId &&
//           job.label.trim().toLowerCase() === label.trim().toLowerCase(),
//       ),
//     [clientFacingJobs],
//   );

//   /** Create (no value) or update (with value). Returns the value (id). */
//   const saveClientFacingJob = useCallback(
//     ({ value, label, color, description = "" }) => {
//       const name = label.trim();
//       if (value) {
//         setClientFacingJobs((list) =>
//           list.map((job) =>
//             job.value === value
//               ? { ...job, label: name, color, description }
//               : job,
//           ),
//         );
//         return value;
//       }
//       const baseId = slug(name) || "job";
//       const existingIds = new Set(clientFacingJobs.map((job) => job.value));
//       let id = baseId;
//       let suffix = 2;
//       while (existingIds.has(id)) {
//         id = `${baseId}-${suffix}`;
//         suffix += 1;
//       }
//       setClientFacingJobs((list) => [
//         { value: id, label: name, color, description, createdAt: today() },
//         ...list,
//       ]);
//       return id;
//     },
//     [clientFacingJobs],
//   );

//   /** Quick create; reuses an existing client-facing job with the same name. */
//   const createClientFacingJob = useCallback(
//     (label) => {
//       const existing = clientFacingJobs.find(
//         (job) => job.label.trim().toLowerCase() === label.trim().toLowerCase(),
//       );
//       return existing
//         ? existing.value
//         : saveClientFacingJob({ label, color: "#475569" });
//     },
//     [clientFacingJobs, saveClientFacingJob],
//   );

//   /** Update the color of selected client-facing jobs. */
//   const recolorClientFacingJobs = useCallback((ids, color) => {
//     setClientFacingJobs((list) =>
//       list.map((job) => (ids.includes(job.value) ? { ...job, color } : job)),
//     );
//   }, []);

//   /** Delete client-facing jobs and clear them from job templates that used them. */
//   const deleteClientFacingJobs = useCallback((ids) => {
//     setClientFacingJobs((list) =>
//       list.filter((job) => !ids.includes(job.value)),
//     );
//     setJobTemplates((list) =>
//       list.map((t) =>
//         ids.includes(t.selectedJob) ? { ...t, selectedJob: null } : t,
//       ),
//     );
//   }, []);
//   /* ---------- Invoice templates ---------- */
//   /** Create (no id) or update (with id). Returns the id. */
//   const saveInvoiceTemplate = useCallback((tpl) => {
//     if (tpl.id) {
//       setInvoiceTemplates((list) =>
//         list.map((t) =>
//           t.id === tpl.id ? { ...t, ...tpl, updatedAt: today() } : t,
//         ),
//       );
//       return tpl.id;
//     }
//     const id = uid("it");
//     setInvoiceTemplates((list) => [
//       { ...tpl, id, updatedAt: today() },
//       ...list,
//     ]);
//     return id;
//   }, []);

//   /** Copy templates with new ids and unique "(copy)" names; copies go to the top. */
//   const duplicateInvoiceTemplates = useCallback(
//     (ids) =>
//       setInvoiceTemplates((list) => {
//         const used = list.map((t) => t.templatename);
//         const copies = list
//           .filter((t) => ids.includes(t.id))
//           .map((t) => {
//             const templatename = copyName(t.templatename, (n) =>
//               used.some((u) => sameName(u, n)),
//             );
//             used.push(templatename);
//             return {
//               ...JSON.parse(JSON.stringify(t)),
//               id: uid("it"),
//               templatename,
//               updatedAt: today(),
//             };
//           });
//         return [...copies, ...list];
//       }),
//     [],
//   );

//   const deleteInvoiceTemplates = useCallback(
//     (ids) =>
//       setInvoiceTemplates((list) => list.filter((t) => !ids.includes(t.id))),
//     [],
//   );

//   /** Returns true if another invoice template already has this name. */
//   const invoiceTemplateNameTaken = useCallback(
//     (name, exceptId) =>
//       invoiceTemplates.some(
//         (t) => t.id !== exceptId && sameName(t.templatename, name),
//       ),
//     [invoiceTemplates],
//   );
//   /* ---------- Proposal templates (Proposals & ELs) ---------- */
//   /** Create (no id) or update (with id). Returns the id. */
//   const saveProposalTemplate = useCallback((tpl) => {
//     if (tpl.id) {
//       setProposalTemplates((list) =>
//         list.map((t) =>
//           t.id === tpl.id ? { ...t, ...tpl, updatedAt: today() } : t,
//         ),
//       );
//       return tpl.id;
//     }
//     const id = uid("pt");
//     setProposalTemplates((list) => [
//       { ...tpl, id, updatedAt: today() },
//       ...list,
//     ]);
//     return id;
//   }, []);

//   /** Copy proposals with new ids and unique "(copy)" template names; copies go to the top. */
//   const duplicateProposalTemplates = useCallback(
//     (ids) =>
//       setProposalTemplates((list) => {
//         const used = list.map((t) => t.general.templateName);
//         const copies = list
//           .filter((t) => ids.includes(t.id))
//           .map((t) => {
//             const templateName = copyName(t.general.templateName, (n) =>
//               used.some((u) => sameName(u, n)),
//             );
//             used.push(templateName);
//             const copy = JSON.parse(JSON.stringify(t));
//             return {
//               ...copy,
//               id: uid("pt"),
//               general: { ...copy.general, templateName },
//               updatedAt: today(),
//             };
//           });
//         return [...copies, ...list];
//       }),
//     [],
//   );

//   const deleteProposalTemplates = useCallback(
//     (ids) =>
//       setProposalTemplates((list) => list.filter((t) => !ids.includes(t.id))),
//     [],
//   );

//   /** Returns true if another proposal template already has this template name. */
//   const proposalTemplateNameTaken = useCallback(
//     (name, exceptId) =>
//       proposalTemplates.some(
//         (t) => t.id !== exceptId && sameName(t.general?.templateName, name),
//       ),
//     [proposalTemplates],
//   );
//   /* ---------- Organizer templates ---------- */
//   /** Create (no id) or update (with id). Returns the id. */
//   const saveOrganizerTemplate = useCallback((tpl) => {
//     if (tpl.id) {
//       setOrganizerTemplates((list) =>
//         list.map((t) =>
//           t.id === tpl.id ? { ...t, ...tpl, updatedAt: today() } : t,
//         ),
//       );
//       return tpl.id;
//     }
//     const id = uid("ot");
//     setOrganizerTemplates((list) => [
//       { ...tpl, id, updatedAt: today() },
//       ...list,
//     ]);
//     return id;
//   }, []);
//   /** Copy organizers with new ids and unique "(copy)" names; copies go to the top. */
//   const duplicateOrganizerTemplates = useCallback(
//     (ids) =>
//       setOrganizerTemplates((list) => {
//         const used = list.map((t) => t.templatename);
//         const copies = list
//           .filter((t) => ids.includes(t.id))
//           .map((t) => {
//             const templatename = copyName(t.templatename, (n) =>
//               used.some((u) => sameName(u, n)),
//             );
//             used.push(templatename);
//             return {
//               ...JSON.parse(JSON.stringify(t)),
//               id: uid("ot"),
//               templatename,
//               updatedAt: today(),
//             };
//           });
//         return [...copies, ...list];
//       }),
//     [],
//   );
//   const deleteOrganizerTemplates = useCallback(
//     (ids) =>
//       setOrganizerTemplates((list) => list.filter((t) => !ids.includes(t.id))),
//     [],
//   );
//   /** Returns true if another organizer template already has this name. */
//   const organizerTemplateNameTaken = useCallback(
//     (name, exceptId) =>
//       organizerTemplates.some(
//         (t) => t.id !== exceptId && sameName(t.templatename, name),
//       ),
//     [organizerTemplates],
//   );
//   /* ---------- Folder templates ---------- */
//   /** Create (no id) or update (with id). Returns the id. */
//   const saveFolderTemplate = useCallback((tpl) => {
//     if (tpl.id) {
//       setFolderTemplates((list) =>
//         list.map((t) =>
//           t.id === tpl.id ? { ...t, ...tpl, updatedAt: today() } : t,
//         ),
//       );
//       return tpl.id;
//     }
//     const id = uid("ft");
//     setFolderTemplates((list) => [{ ...tpl, id, updatedAt: today() }, ...list]);
//     return id;
//   }, []);
//   /** Copy templates with new ids and unique "(copy)" names; copies go to the top. */
//   const duplicateFolderTemplates = useCallback(
//     (ids) =>
//       setFolderTemplates((list) => {
//         const used = list.map((t) => t.templatename);
//         const copies = list
//           .filter((t) => ids.includes(t.id))
//           .map((t) => {
//             const templatename = copyName(t.templatename, (n) =>
//               used.some((u) => sameName(u, n)),
//             );
//             used.push(templatename);
//             return {
//               ...JSON.parse(JSON.stringify(t)),
//               id: uid("ft"),
//               templatename,
//               updatedAt: today(),
//             };
//           });
//         return [...copies, ...list];
//       }),
//     [],
//   );
//   const deleteFolderTemplates = useCallback(
//     (ids) =>
//       setFolderTemplates((list) => list.filter((t) => !ids.includes(t.id))),
//     [],
//   );
//   /** Returns true if another folder template already has this name. */
//   const folderTemplateNameTaken = useCallback(
//     (name, exceptId) =>
//       folderTemplates.some(
//         (t) => t.id !== exceptId && sameName(t.templatename, name),
//       ),
//     [folderTemplates],
//   );

//   /* ---------- Task templates ---------- */
//   /** Create (no id) or update (with id). Returns the id. */
//   const saveTaskTemplate = useCallback((tpl) => {
//     if (tpl.id) {
//       setTaskTemplates((list) =>
//         list.map((t) =>
//           t.id === tpl.id ? { ...t, ...tpl, updatedAt: today() } : t,
//         ),
//       );
//       return tpl.id;
//     }
//     const id = `tt-${Date.now().toString(36)}`;
//     setTaskTemplates((list) => [{ ...tpl, id, updatedAt: today() }, ...list]);
//     return id;
//   }, []);
//   const duplicateTaskTemplates = useCallback(
//     (ids) =>
//       setTaskTemplates((list) => [
//         ...list
//           .filter((t) => ids.includes(t.id))
//           .map((t, i) => ({
//             ...JSON.parse(JSON.stringify(t)),
//             id: `tt-${Date.now().toString(36)}-${i}`,
//             templatename: `${t.templatename} (copy)`,
//             updatedAt: today(),
//           })),
//         ...list,
//       ]),
//     [],
//   );
//   const deleteTaskTemplates = useCallback(
//     (ids) =>
//       setTaskTemplates((list) => list.filter((t) => !ids.includes(t.id))),
//     [],
//   );

//   /* ---------- Email templates ---------- */
//   const saveEmailTemplate = useCallback((tpl) => {
//     if (tpl.id) {
//       setEmailTemplates((list) =>
//         list.map((t) =>
//           t.id === tpl.id ? { ...t, ...tpl, updatedAt: today() } : t,
//         ),
//       );
//       return tpl.id;
//     }
//     const id = `et-${Date.now().toString(36)}`;
//     setEmailTemplates((list) => [{ ...tpl, id, updatedAt: today() }, ...list]);
//     return id;
//   }, []);
//   const duplicateEmailTemplates = useCallback(
//     (ids) =>
//       setEmailTemplates((list) => [
//         ...list
//           .filter((t) => ids.includes(t.id))
//           .map((t, i) => ({
//             ...JSON.parse(JSON.stringify(t)),
//             id: `et-${Date.now().toString(36)}-${i}`,
//             templateName: `${t.templateName} (copy)`,
//             updatedAt: today(),
//           })),
//         ...list,
//       ]),
//     [],
//   );
//   const deleteEmailTemplates = useCallback(
//     (ids) =>
//       setEmailTemplates((list) => list.filter((t) => !ids.includes(t.id))),
//     [],
//   );

//   /* ---------- Job templates ---------- */
//   const saveJobTemplate = useCallback((tpl) => {
//     if (tpl.id) {
//       setJobTemplates((list) =>
//         list.map((t) =>
//           t.id === tpl.id ? { ...t, ...tpl, updatedAt: today() } : t,
//         ),
//       );
//       return tpl.id;
//     }
//     const id = `jt-${Date.now().toString(36)}`;
//     setJobTemplates((list) => [{ ...tpl, id, updatedAt: today() }, ...list]);
//     return id;
//   }, []);
//   const duplicateJobTemplates = useCallback(
//     (ids) =>
//       setJobTemplates((list) => [
//         ...list
//           .filter((t) => ids.includes(t.id))
//           .map((t, i) => ({
//             ...JSON.parse(JSON.stringify(t)),
//             id: `jt-${Date.now().toString(36)}-${i}`,
//             templatename: `${t.templatename} (copy)`,
//             updatedAt: today(),
//           })),
//         ...list,
//       ]),
//     [],
//   );
//   const deleteJobTemplates = useCallback(
//     (ids) => setJobTemplates((list) => list.filter((t) => !ids.includes(t.id))),
//     [],
//   );
//   /* ---------- Jobs (pipeline boards) ---------- */
//   /** Create (no id) or update (with id). Returns the id. Moving to another stage resets "days in stage". */
//   const saveJob = useCallback((job) => {
//     const now = new Date().toISOString();
//     if (job.id) {
//       setJobs((list) =>
//         list.map((j) =>
//           j.id === job.id
//             ? {
//                 ...j,
//                 ...job,
//                 enteredStageAt:
//                   j.stageId !== job.stageId ? now : j.enteredStageAt,
//                 updatedAt: now,
//               }
//             : j,
//         ),
//       );
//       return job.id;
//     }
//     const id = uid("job");
//     setJobs((list) => [
//       ...list,
//       { ...job, id, createdAt: now, enteredStageAt: now, updatedAt: now },
//     ]);
//     return id;
//   }, []);
//   /** Move a job to another stage. */
//   const moveJob = useCallback(
//     (id, stageId) =>
//       setJobs((list) =>
//         list.map((j) =>
//           j.id === id && j.stageId !== stageId
//             ? { ...j, stageId, enteredStageAt: new Date().toISOString() }
//             : j,
//         ),
//       ),
//     [],
//   );
//   const deleteJobs = useCallback(
//     (ids) => setJobs((list) => list.filter((j) => !ids.includes(j.id))),
//     [],
//   );

//   /* ---------- Pipelines ---------- */
//   /** Returns true if another pipeline already has this name. */
//   const pipelineNameTaken = useCallback(
//     (name, exceptId) =>
//       pipelines.some(
//         (p) => p.id !== exceptId && sameName(p.pipelineName, name),
//       ),
//     [pipelines],
//   );

//   /** Create (no id) or update (with id). Returns the saved pipeline. */
//   const savePipeline = useCallback((pipeline) => {
//     const rec = {
//       ...pipeline,
//       id: pipeline.id || uid("pl"),
//       pipelineName: pipeline.pipelineName.trim(),
//       stages: pipeline.stages.map((s) => ({ ...s, name: s.name.trim() })),
//       updatedAt: new Date().toISOString(),
//     };
//     setPipelines((list) =>
//       list.some((p) => p.id === rec.id)
//         ? list.map((p) => (p.id === rec.id ? rec : p))
//         : [rec, ...list],
//     );
//     return rec;
//   }, []);

//   /** Copy a pipeline with new ids for it, its stages and automations. Returns the copy. */
//   const duplicatePipeline = useCallback(
//     (id) => {
//       const src = pipelines.find((p) => p.id === id);
//       if (!src) return null;
//       let name = `${src.pipelineName} (copy)`;
//       for (
//         let n = 2;
//         pipelines.some((p) => sameName(p.pipelineName, name));
//         n += 1
//       )
//         name = `${src.pipelineName} (copy ${n})`;
//       const copy = {
//         ...JSON.parse(JSON.stringify(src)),
//         id: uid("pl"),
//         pipelineName: name,
//         stages: src.stages.map((s) => ({
//           ...JSON.parse(JSON.stringify(s)),
//           id: uid("stage"),
//           automations: s.automations.map((a) => ({ ...a, id: uid("auto") })),
//         })),
//         updatedAt: new Date().toISOString(),
//       };
//       setPipelines((list) => [copy, ...list]);
//       return copy;
//     },
//     [pipelines],
//   );

//   const deletePipelines = useCallback(
//     (ids) => setPipelines((list) => list.filter((p) => !ids.includes(p.id))),
//     [],
//   );

//   /* ---------- Service categories ---------- */
//   /** Returns true if another category already has this name. */
//   const serviceCategoryNameTaken = useCallback(
//     (name, exceptId) =>
//       serviceCategories.some(
//         (c) => c.id !== exceptId && sameName(c.name, name),
//       ),
//     [serviceCategories],
//   );

//   /** Create (no id) or update (with id). Returns the saved category. */
//   const saveServiceCategory = useCallback(({ id, name, description = "" }) => {
//     const rec = {
//       id: id || uid("cat"),
//       name: name.trim(),
//       description: description.trim(),
//     };
//     setServiceCategories((list) =>
//       id
//         ? list.map((c) => (c.id === id ? { ...c, ...rec } : c))
//         : [...list, rec],
//     );
//     return rec;
//   }, []);

//   /** Delete categories; their services stay, with no category. */
//   const deleteServiceCategories = useCallback((ids) => {
//     setServiceCategories((list) => list.filter((c) => !ids.includes(c.id)));
//     setServices((list) =>
//       list.map((s) =>
//         ids.includes(s.categoryId) ? { ...s, categoryId: null } : s,
//       ),
//     );
//   }, []);

//   /* ---------- Services ---------- */
//   /** Look up one service by id (for the edit form). */
//   const getService = useCallback(
//     (id) => services.find((s) => s.id === id) || null,
//     [services],
//   );

//   /** Returns true if another service already has this name. */
//   const serviceNameTaken = useCallback(
//     (name, exceptId) =>
//       services.some((s) => s.id !== exceptId && sameName(s.name, name)),
//     [services],
//   );

//   /** Create a new service. Returns the saved service. */
//   const createService = useCallback((service) => {
//     const now = new Date().toISOString();
//     const rec = {
//       ...service,
//       id: uid("svc"),
//       name: (service.name || "").trim(),
//       description: (service.description || "").trim(),
//       categoryId: service.categoryId ?? null,
//       createdAt: now,
//       updatedAt: now,
//     };
//     setServices((list) => [rec, ...list]);
//     return rec;
//   }, []);

//   /** Edit an existing service (only the fields passed in change). Returns the updated service, or null if not found. */
//   const updateService = useCallback(
//     (id, changes) => {
//       const current = services.find((s) => s.id === id);
//       if (!current) return null;
//       const rec = {
//         ...current,
//         ...changes,
//         id,
//         name: (changes.name ?? current.name ?? "").trim(),
//         description: (changes.description ?? current.description ?? "").trim(),
//         updatedAt: new Date().toISOString(),
//       };
//       setServices((list) => list.map((s) => (s.id === id ? rec : s)));
//       return rec;
//     },
//     [services],
//   );

//   /** Create (no id) or update (with id). Returns the saved service. Kept so existing forms keep working. */
//   const saveService = useCallback(
//     (service) =>
//       service.id ? updateService(service.id, service) : createService(service),
//     [createService, updateService],
//   );

//   /** Copy services with new ids and unique "(copy)" names; copies go to the top of the list. Returns the copies. */
//   const duplicateServices = useCallback(
//     (ids) => {
//       const now = new Date().toISOString();
//       const usedNames = services.map((s) => s.name);
//       const copies = services
//         .filter((s) => ids.includes(s.id))
//         .map((s) => {
//           const name = copyName(s.name, (n) =>
//             usedNames.some((u) => sameName(u, n)),
//           );
//           usedNames.push(name);
//           return {
//             ...JSON.parse(JSON.stringify(s)),
//             id: uid("svc"),
//             name,
//             createdAt: now,
//             updatedAt: now,
//           };
//         });
//       if (copies.length) setServices((list) => [...copies, ...list]);
//       return copies;
//     },
//     [services],
//   );

//   /** Delete one or more services. */
//   const deleteServices = useCallback(
//     (ids) => setServices((list) => list.filter((s) => !ids.includes(s.id))),
//     [],
//   );

//   /** Move services into a category (pass null to remove them from their category). */
//   const moveServicesToCategory = useCallback((ids, categoryId) => {
//     setServices((list) =>
//       list.map((s) =>
//         ids.includes(s.id)
//           ? { ...s, categoryId, updatedAt: new Date().toISOString() }
//           : s,
//       ),
//     );
//   }, []);

//   /* ---------- Accounts & contacts ---------- */
//   /** Add an account from the Add account drawer's form. Returns the new account. */
//   const addAccount = useCallback((form) => {
//     const name = (form.name || "").trim() || "New account";
//     const rec = {
//       id: `AC-${Date.now().toString(36).toUpperCase()}`,
//       name,
//       company: form.company || "",
//       email: form.email || "",
//       owner: "",
//       team: form.team || [],
//       tags: form.tags || [],
//       contacts: form.contacts || [],
//       role: form.role || "Editor",
//       status: form.status || "Active",
//       plan: form.plan || "Pro",
//       joined: today(),
//     };
//     setAccounts((list) => [rec, ...list]);
//     return rec;
//   }, []);

//   /** Delete tags and remove them from every account and contact. */
//   const deleteTags = useCallback((ids) => {
//     setTags((list) => list.filter((t) => !ids.includes(t.value)));
//     setAccounts((list) =>
//       list.map((a) => ({
//         ...a,
//         tags: (a.tags || []).filter((id) => !ids.includes(id)),
//       })),
//     );
//     setContacts((list) =>
//       list.map((c) => ({
//         ...c,
//         tags: (c.tags || []).filter((id) => !ids.includes(id)),
//       })),
//     );
//   }, []);

//   /** Create (no id) or update (with id) a contact. Returns the contact id. */
//   const saveContact = useCallback((contact) => {
//     if (contact.id) {
//       setContacts((list) =>
//         list.map((c) => (c.id === contact.id ? { ...c, ...contact } : c)),
//       );
//       return contact.id;
//     }
//     const id = `CT-${Date.now().toString(36).toUpperCase()}`;
//     setContacts((list) => [{ ...contact, id, createdAt: today() }, ...list]);
//     return id;
//   }, []);
//   const deleteContacts = useCallback(
//     (ids) => setContacts((list) => list.filter((c) => !ids.includes(c.id))),
//     [],
//   );

//   const value = useMemo(
//     () => ({
//       accounts,
//       setAccounts,
//       tags,
//       tagById,
//       tagUsage,
//       nameTaken,
//       saveTag,
//       createTag,
//       recolorTags,
//       deleteTags,
//       contacts,
//       setContacts,
//       saveContact,
//       deleteContacts,
//       addAccount,
//       taskTemplates,
//       saveTaskTemplate,
//       duplicateTaskTemplates,
//       deleteTaskTemplates,
//       emailTemplates,
//       saveEmailTemplate,
//       duplicateEmailTemplates,
//       deleteEmailTemplates,
//       clientFacingJobs,
//       setClientFacingJobs,
//       clientFacingJobNameTaken,
//       saveClientFacingJob,
//       createClientFacingJob,
//       recolorClientFacingJobs,
//       deleteClientFacingJobs,
//       jobTemplates,
//       saveJobTemplate,
//       duplicateJobTemplates,
//       deleteJobTemplates,
//       pipelines,
//       pipelineNameTaken,
//       savePipeline,
//       duplicatePipeline,
//       deletePipelines,
//       services,
//       getService,
//       serviceNameTaken,
//       createService,
//       updateService,
//       saveService,
//       duplicateServices,
//       deleteServices,
//       moveServicesToCategory,
//       serviceCategories,
//       serviceCategoryNameTaken,
//       saveServiceCategory,
//       deleteServiceCategories,
//       chatTemplates,
//       saveChatTemplate,
//       duplicateChatTemplates,
//       deleteChatTemplates,
//       chatTemplateNameTaken,
//       invoiceTemplates,
//       saveInvoiceTemplate,
//       duplicateInvoiceTemplates,
//       deleteInvoiceTemplates,
//       invoiceTemplateNameTaken,
//       proposalTemplates,
//       saveProposalTemplate,
//       duplicateProposalTemplates,
//       deleteProposalTemplates,
//       proposalTemplateNameTaken,
//       organizerTemplates,
//       saveOrganizerTemplate,
//       duplicateOrganizerTemplates,
//       deleteOrganizerTemplates,
//       organizerTemplateNameTaken,
//       folderTemplates,
//       saveFolderTemplate,
//       duplicateFolderTemplates,
//       deleteFolderTemplates,
//       folderTemplateNameTaken,
//       jobs,
//       saveJob,
//       moveJob,
//       deleteJobs,
//     }),
//     [
//       accounts,
//       tags,
//       tagById,
//       tagUsage,
//       nameTaken,
//       saveTag,
//       createTag,
//       recolorTags,
//       deleteTags,
//       contacts,
//       saveContact,
//       deleteContacts,
//       addAccount,
//       taskTemplates,
//       saveTaskTemplate,
//       duplicateTaskTemplates,
//       deleteTaskTemplates,
//       emailTemplates,
//       saveEmailTemplate,
//       duplicateEmailTemplates,
//       deleteEmailTemplates,
//       clientFacingJobs,
//       clientFacingJobNameTaken,
//       saveClientFacingJob,
//       createClientFacingJob,
//       recolorClientFacingJobs,
//       deleteClientFacingJobs,
//       jobTemplates,
//       saveJobTemplate,
//       duplicateJobTemplates,
//       deleteJobTemplates,
//       pipelines,
//       pipelineNameTaken,
//       savePipeline,
//       duplicatePipeline,
//       deletePipelines,
//       services,
//       getService,
//       serviceNameTaken,
//       createService,
//       updateService,
//       saveService,
//       duplicateServices,
//       deleteServices,
//       moveServicesToCategory,
//       serviceCategories,
//       serviceCategoryNameTaken,
//       saveServiceCategory,
//       deleteServiceCategories,
//       chatTemplates,
//       saveChatTemplate,
//       duplicateChatTemplates,
//       deleteChatTemplates,
//       chatTemplateNameTaken,
//       invoiceTemplates,
//       saveInvoiceTemplate,
//       duplicateInvoiceTemplates,
//       deleteInvoiceTemplates,
//       invoiceTemplateNameTaken,
//       proposalTemplates,
//       saveProposalTemplate,
//       duplicateProposalTemplates,
//       deleteProposalTemplates,
//       proposalTemplateNameTaken,
//       organizerTemplates,
//       saveOrganizerTemplate,
//       duplicateOrganizerTemplates,
//       deleteOrganizerTemplates,
//       organizerTemplateNameTaken,
//       folderTemplates,
//       saveFolderTemplate,
//       duplicateFolderTemplates,
//       deleteFolderTemplates,
//       folderTemplateNameTaken,
//       jobs,
//       saveJob,
//       moveJob,
//       deleteJobs,
//     ],
//   );

//   return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
// }

// export const useData = () => useContext(DataContext);

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { DEFAULT_TAGS, seedAccounts, seedContacts } from "../data/sampleData";
import { seedTaskTemplates } from "../data/taskTemplates";
import { seedEmailTemplates } from "../data/emailtemplates";
import { seedClientFacingJobs } from "../data/clientFacingJobs";
import { seedJobTemplates } from "../data/jobtemplates";
import { SEED_PIPELINES } from "../data/pipelinesdata";
import { SEED_CATEGORIES, SEED_SERVICES } from "../data/servicesData";
import { seedChatTemplates } from "../data/chatTemplates";
import { seedInvoiceTemplates } from "../data/invoiceTemplates";
import { seedProposalTemplates } from "../data/proposalTemplates";
import { seedOrganizerTemplates } from "../data/organizerTemplates";
import { seedFolderTemplates } from "../data/folderTemplates";
import { seedJobs } from "../data/jobs";
import { runAutomations } from "../data/automations";
import { fillShortcodes } from "../data/accountChats";

/**
 * Shared app data: accounts, contacts, tags, task / email / job templates, client-facing jobs (statuses),
 * pipelines + jobs (with stage automations), services and service categories,
 * and chat / invoice / proposal / organizer / folder templates.
 * Accounts and contacts store tag ids, so renaming or recolouring a tag updates them instantly.
 * Job templates store a client-facing job's `value` in `selectedJob`.
 * Services store their category's `id` in `categoryId`.
 * Replace the useState seeds with API calls when you add a backend.
 */
const DataContext = createContext(null);

const slug = (label) =>
  label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "tag";
const today = () => new Date().toISOString().slice(0, 10);
const uid = (prefix) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const sameName = (a = "", b = "") =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

/** Returns `${base} (copy)`, `${base} (copy 2)`, … — the first name not already used. */
const copyName = (base, isTaken) => {
  let name = `${base} (copy)`;
  for (let n = 2; isTaken(name); n += 1) name = `${base} (copy ${n})`;
  return name;
};

export function DataProvider({ children }) {
  const [accounts, setAccounts] = useState(seedAccounts);
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [contacts, setContacts] = useState(seedContacts);
  const [taskTemplates, setTaskTemplates] = useState(seedTaskTemplates);
  const [emailTemplates, setEmailTemplates] = useState(seedEmailTemplates);
  const [clientFacingJobs, setClientFacingJobs] = useState(seedClientFacingJobs);
  const [jobTemplates, setJobTemplates] = useState(seedJobTemplates);
  const [pipelines, setPipelines] = useState(SEED_PIPELINES);
  const [jobs, setJobs] = useState(seedJobs);
  const [services, setServices] = useState(SEED_SERVICES);
  const [serviceCategories, setServiceCategories] = useState(SEED_CATEGORIES);
  const [chatTemplates, setChatTemplates] = useState(seedChatTemplates);
  const [invoiceTemplates, setInvoiceTemplates] = useState(seedInvoiceTemplates);
  const [proposalTemplates, setProposalTemplates] = useState(seedProposalTemplates);
  const [organizerTemplates, setOrganizerTemplates] = useState(seedOrganizerTemplates);
  const [folderTemplates, setFolderTemplates] = useState(seedFolderTemplates);

  const tagById = useMemo(() => new Map(tags.map((t) => [t.value, t])), [tags]);
  const tagUsage = useMemo(() => {
    const m = new Map();
    accounts.forEach((a) =>
      (a.tags || []).forEach((id) => m.set(id, (m.get(id) || 0) + 1)),
    );
    return m;
  }, [accounts]);

  /* ---------- Tags ---------- */
  /** Returns true if another tag already has this name. */
  const nameTaken = useCallback(
    (label, exceptId) =>
      tags.some(
        (t) =>
          t.value !== exceptId &&
          t.label.trim().toLowerCase() === label.trim().toLowerCase(),
      ),
    [tags],
  );

  /** Create (no id) or update (with id). Returns the tag id. */
  const saveTag = useCallback(
    ({ value, label, color, description = "" }) => {
      if (value) {
        setTags((list) =>
          list.map((t) =>
            t.value === value
              ? { ...t, label: label.trim(), color, description }
              : t,
          ),
        );
        return value;
      }
      let id = slug(label);
      const ids = new Set(tags.map((t) => t.value));
      let n = 2;
      while (ids.has(id)) {
        id = `${slug(label)}-${n}`;
        n += 1;
      }
      setTags((list) => [
        ...list,
        { value: id, label: label.trim(), color, description, createdAt: today() },
      ]);
      return id;
    },
    [tags],
  );

  /** Quick create from a multi-select ("Create tag …"). Reuses an existing tag with the same name. */
  const createTag = useCallback(
    (label) => {
      const existing = tags.find(
        (t) => t.label.toLowerCase() === label.trim().toLowerCase(),
      );
      return existing ? existing.value : saveTag({ label, color: "#475569" });
    },
    [tags, saveTag],
  );

  const recolorTags = useCallback(
    (ids, color) =>
      setTags((list) =>
        list.map((t) => (ids.includes(t.value) ? { ...t, color } : t)),
      ),
    [],
  );

  /* ---------- Chat templates ---------- */
  /** Create (no id) or update (with id). Returns the id. */
  const saveChatTemplate = useCallback((tpl) => {
    if (tpl.id) {
      setChatTemplates((list) =>
        list.map((t) => (t.id === tpl.id ? { ...t, ...tpl, updatedAt: today() } : t)),
      );
      return tpl.id;
    }
    const id = uid("ct");
    setChatTemplates((list) => [{ ...tpl, id, updatedAt: today() }, ...list]);
    return id;
  }, []);

  /** Copy templates with new ids and unique "(copy)" names; copies go to the top. */
  const duplicateChatTemplates = useCallback(
    (ids) =>
      setChatTemplates((list) => {
        const used = list.map((t) => t.templateName);
        const copies = list
          .filter((t) => ids.includes(t.id))
          .map((t) => {
            const templateName = copyName(t.templateName, (n) => used.some((u) => sameName(u, n)));
            used.push(templateName);
            return { ...JSON.parse(JSON.stringify(t)), id: uid("ct"), templateName, updatedAt: today() };
          });
        return [...copies, ...list];
      }),
    [],
  );

  const deleteChatTemplates = useCallback(
    (ids) => setChatTemplates((list) => list.filter((t) => !ids.includes(t.id))),
    [],
  );

  /** Returns true if another chat template already has this name. */
  const chatTemplateNameTaken = useCallback(
    (name, exceptId) => chatTemplates.some((t) => t.id !== exceptId && sameName(t.templateName, name)),
    [chatTemplates],
  );

  /* ---------- Client-facing jobs (statuses shown in the client portal) ---------- */
  /** Returns true if another client-facing job already has this name. */
  const clientFacingJobNameTaken = useCallback(
    (label, exceptId) =>
      clientFacingJobs.some(
        (job) => job.value !== exceptId && job.label.trim().toLowerCase() === label.trim().toLowerCase(),
      ),
    [clientFacingJobs],
  );

  /** Create (no value) or update (with value). Returns the value (id). */
  const saveClientFacingJob = useCallback(
    ({ value, label, color, description = "" }) => {
      const name = label.trim();
      if (value) {
        setClientFacingJobs((list) =>
          list.map((job) => (job.value === value ? { ...job, label: name, color, description } : job)),
        );
        return value;
      }
      const baseId = slug(name) || "job";
      const existingIds = new Set(clientFacingJobs.map((job) => job.value));
      let id = baseId;
      let suffix = 2;
      while (existingIds.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }
      setClientFacingJobs((list) => [{ value: id, label: name, color, description, createdAt: today() }, ...list]);
      return id;
    },
    [clientFacingJobs],
  );

  /** Quick create; reuses an existing client-facing job with the same name. */
  const createClientFacingJob = useCallback(
    (label) => {
      const existing = clientFacingJobs.find((job) => job.label.trim().toLowerCase() === label.trim().toLowerCase());
      return existing ? existing.value : saveClientFacingJob({ label, color: "#475569" });
    },
    [clientFacingJobs, saveClientFacingJob],
  );

  /** Update the color of selected client-facing jobs. */
  const recolorClientFacingJobs = useCallback((ids, color) => {
    setClientFacingJobs((list) => list.map((job) => (ids.includes(job.value) ? { ...job, color } : job)));
  }, []);

  /** Delete client-facing jobs and clear them from job templates that used them. */
  const deleteClientFacingJobs = useCallback((ids) => {
    setClientFacingJobs((list) => list.filter((job) => !ids.includes(job.value)));
    setJobTemplates((list) => list.map((t) => (ids.includes(t.selectedJob) ? { ...t, selectedJob: null } : t)));
  }, []);

  /* ---------- Invoice templates ---------- */
  /** Create (no id) or update (with id). Returns the id. */
  const saveInvoiceTemplate = useCallback((tpl) => {
    if (tpl.id) {
      setInvoiceTemplates((list) => list.map((t) => (t.id === tpl.id ? { ...t, ...tpl, updatedAt: today() } : t)));
      return tpl.id;
    }
    const id = uid("it");
    setInvoiceTemplates((list) => [{ ...tpl, id, updatedAt: today() }, ...list]);
    return id;
  }, []);

  /** Copy templates with new ids and unique "(copy)" names; copies go to the top. */
  const duplicateInvoiceTemplates = useCallback(
    (ids) =>
      setInvoiceTemplates((list) => {
        const used = list.map((t) => t.templatename);
        const copies = list
          .filter((t) => ids.includes(t.id))
          .map((t) => {
            const templatename = copyName(t.templatename, (n) => used.some((u) => sameName(u, n)));
            used.push(templatename);
            return { ...JSON.parse(JSON.stringify(t)), id: uid("it"), templatename, updatedAt: today() };
          });
        return [...copies, ...list];
      }),
    [],
  );

  const deleteInvoiceTemplates = useCallback(
    (ids) => setInvoiceTemplates((list) => list.filter((t) => !ids.includes(t.id))),
    [],
  );

  /** Returns true if another invoice template already has this name. */
  const invoiceTemplateNameTaken = useCallback(
    (name, exceptId) => invoiceTemplates.some((t) => t.id !== exceptId && sameName(t.templatename, name)),
    [invoiceTemplates],
  );

  /* ---------- Proposal templates (Proposals & ELs) ---------- */
  /** Create (no id) or update (with id). Returns the id. */
  const saveProposalTemplate = useCallback((tpl) => {
    if (tpl.id) {
      setProposalTemplates((list) => list.map((t) => (t.id === tpl.id ? { ...t, ...tpl, updatedAt: today() } : t)));
      return tpl.id;
    }
    const id = uid("pt");
    setProposalTemplates((list) => [{ ...tpl, id, updatedAt: today() }, ...list]);
    return id;
  }, []);

  /** Copy proposals with new ids and unique "(copy)" template names; copies go to the top. */
  const duplicateProposalTemplates = useCallback(
    (ids) =>
      setProposalTemplates((list) => {
        const used = list.map((t) => t.general.templateName);
        const copies = list
          .filter((t) => ids.includes(t.id))
          .map((t) => {
            const templateName = copyName(t.general.templateName, (n) => used.some((u) => sameName(u, n)));
            used.push(templateName);
            const copy = JSON.parse(JSON.stringify(t));
            return { ...copy, id: uid("pt"), general: { ...copy.general, templateName }, updatedAt: today() };
          });
        return [...copies, ...list];
      }),
    [],
  );

  const deleteProposalTemplates = useCallback(
    (ids) => setProposalTemplates((list) => list.filter((t) => !ids.includes(t.id))),
    [],
  );

  /** Returns true if another proposal template already has this template name. */
  const proposalTemplateNameTaken = useCallback(
    (name, exceptId) => proposalTemplates.some((t) => t.id !== exceptId && sameName(t.general?.templateName, name)),
    [proposalTemplates],
  );

  /* ---------- Organizer templates ---------- */
  /** Create (no id) or update (with id). Returns the id. */
  const saveOrganizerTemplate = useCallback((tpl) => {
    if (tpl.id) {
      setOrganizerTemplates((list) => list.map((t) => (t.id === tpl.id ? { ...t, ...tpl, updatedAt: today() } : t)));
      return tpl.id;
    }
    const id = uid("ot");
    setOrganizerTemplates((list) => [{ ...tpl, id, updatedAt: today() }, ...list]);
    return id;
  }, []);

  /** Copy organizers with new ids and unique "(copy)" names; copies go to the top. */
  const duplicateOrganizerTemplates = useCallback(
    (ids) =>
      setOrganizerTemplates((list) => {
        const used = list.map((t) => t.templatename);
        const copies = list
          .filter((t) => ids.includes(t.id))
          .map((t) => {
            const templatename = copyName(t.templatename, (n) => used.some((u) => sameName(u, n)));
            used.push(templatename);
            return { ...JSON.parse(JSON.stringify(t)), id: uid("ot"), templatename, updatedAt: today() };
          });
        return [...copies, ...list];
      }),
    [],
  );

  const deleteOrganizerTemplates = useCallback(
    (ids) => setOrganizerTemplates((list) => list.filter((t) => !ids.includes(t.id))),
    [],
  );

  /** Returns true if another organizer template already has this name. */
  const organizerTemplateNameTaken = useCallback(
    (name, exceptId) => organizerTemplates.some((t) => t.id !== exceptId && sameName(t.templatename, name)),
    [organizerTemplates],
  );

  /* ---------- Folder templates ---------- */
  /** Create (no id) or update (with id). Returns the id. */
  const saveFolderTemplate = useCallback((tpl) => {
    if (tpl.id) {
      setFolderTemplates((list) => list.map((t) => (t.id === tpl.id ? { ...t, ...tpl, updatedAt: today() } : t)));
      return tpl.id;
    }
    const id = uid("ft");
    setFolderTemplates((list) => [{ ...tpl, id, updatedAt: today() }, ...list]);
    return id;
  }, []);

  /** Copy templates with new ids and unique "(copy)" names; copies go to the top. */
  const duplicateFolderTemplates = useCallback(
    (ids) =>
      setFolderTemplates((list) => {
        const used = list.map((t) => t.templatename);
        const copies = list
          .filter((t) => ids.includes(t.id))
          .map((t) => {
            const templatename = copyName(t.templatename, (n) => used.some((u) => sameName(u, n)));
            used.push(templatename);
            return { ...JSON.parse(JSON.stringify(t)), id: uid("ft"), templatename, updatedAt: today() };
          });
        return [...copies, ...list];
      }),
    [],
  );

  const deleteFolderTemplates = useCallback(
    (ids) => setFolderTemplates((list) => list.filter((t) => !ids.includes(t.id))),
    [],
  );

  /** Returns true if another folder template already has this name. */
  const folderTemplateNameTaken = useCallback(
    (name, exceptId) => folderTemplates.some((t) => t.id !== exceptId && sameName(t.templatename, name)),
    [folderTemplates],
  );

  /* ---------- Task templates ---------- */
  /** Create (no id) or update (with id). Returns the id. */
  const saveTaskTemplate = useCallback((tpl) => {
    if (tpl.id) {
      setTaskTemplates((list) => list.map((t) => (t.id === tpl.id ? { ...t, ...tpl, updatedAt: today() } : t)));
      return tpl.id;
    }
    const id = `tt-${Date.now().toString(36)}`;
    setTaskTemplates((list) => [{ ...tpl, id, updatedAt: today() }, ...list]);
    return id;
  }, []);
  const duplicateTaskTemplates = useCallback(
    (ids) =>
      setTaskTemplates((list) => [
        ...list
          .filter((t) => ids.includes(t.id))
          .map((t, i) => ({ ...JSON.parse(JSON.stringify(t)), id: `tt-${Date.now().toString(36)}-${i}`, templatename: `${t.templatename} (copy)`, updatedAt: today() })),
        ...list,
      ]),
    [],
  );
  const deleteTaskTemplates = useCallback(
    (ids) => setTaskTemplates((list) => list.filter((t) => !ids.includes(t.id))),
    [],
  );

  /* ---------- Email templates ---------- */
  const saveEmailTemplate = useCallback((tpl) => {
    if (tpl.id) {
      setEmailTemplates((list) => list.map((t) => (t.id === tpl.id ? { ...t, ...tpl, updatedAt: today() } : t)));
      return tpl.id;
    }
    const id = `et-${Date.now().toString(36)}`;
    setEmailTemplates((list) => [{ ...tpl, id, updatedAt: today() }, ...list]);
    return id;
  }, []);
  const duplicateEmailTemplates = useCallback(
    (ids) =>
      setEmailTemplates((list) => [
        ...list
          .filter((t) => ids.includes(t.id))
          .map((t, i) => ({ ...JSON.parse(JSON.stringify(t)), id: `et-${Date.now().toString(36)}-${i}`, templateName: `${t.templateName} (copy)`, updatedAt: today() })),
        ...list,
      ]),
    [],
  );
  const deleteEmailTemplates = useCallback(
    (ids) => setEmailTemplates((list) => list.filter((t) => !ids.includes(t.id))),
    [],
  );

  /* ---------- Job templates ---------- */
  const saveJobTemplate = useCallback((tpl) => {
    if (tpl.id) {
      setJobTemplates((list) => list.map((t) => (t.id === tpl.id ? { ...t, ...tpl, updatedAt: today() } : t)));
      return tpl.id;
    }
    const id = `jt-${Date.now().toString(36)}`;
    setJobTemplates((list) => [{ ...tpl, id, updatedAt: today() }, ...list]);
    return id;
  }, []);
  const duplicateJobTemplates = useCallback(
    (ids) =>
      setJobTemplates((list) => [
        ...list
          .filter((t) => ids.includes(t.id))
          .map((t, i) => ({ ...JSON.parse(JSON.stringify(t)), id: `jt-${Date.now().toString(36)}-${i}`, templatename: `${t.templatename} (copy)`, updatedAt: today() })),
        ...list,
      ]),
    [],
  );
  const deleteJobTemplates = useCallback(
    (ids) => setJobTemplates((list) => list.filter((t) => !ids.includes(t.id))),
    [],
  );

  /* ---------- Jobs (pipeline boards) + stage automations ---------- */
  /** Templates and lookups the automations need. Client-facing statuses are YOUR clientFacingJobs. */
  const automationCtx = (me) => ({
    chatTemplates, emailTemplates, organizerTemplates, proposalTemplates, invoiceTemplates, folderTemplates, taskTemplates,
    statuses: clientFacingJobs,
    tagById,
    me: me || "Harbor",
  });
  const stageOf = (pipelineId, stageId) => pipelines.find((p) => p.id === pipelineId)?.stages.find((s) => s.id === stageId);
  /** Write the accounts that automations changed. */
  const commitAccounts = (changed) => {
    if (changed.size) setAccounts((list) => list.map((a) => (changed.has(a.id) ? { ...a, ...changed.get(a.id) } : a)));
  };

  /**
   * Create one job per account. Runs the chosen automations of the job's stage for each account.
   * Returns { jobs, results: [{ accountName, results }] }.
   */
  const createJobs = useCallback((accountIds, data, { automationIds = [], me } = {}) => {
    const now = new Date().toISOString();
    const autos = (stageOf(data.pipelineId, data.stageId)?.automations || []).filter((a) => automationIds.includes(a.id));
    const changed = new Map();
    const made = [];
    const results = [];
    accountIds.forEach((accountId) => {
      const account = accounts.find((a) => a.id === accountId);
      if (!account) return;
      let job = {
        ...data, id: uid("job"), accountId,
        name: fillShortcodes(data.name, account),
        inputText: fillShortcodes(data.inputText || "", account),
        clientDescription: fillShortcodes(data.clientDescription || "", account),
        createdAt: now, enteredStageAt: now, updatedAt: now, activity: [],
      };
      if (autos.length) {
        const r = runAutomations(autos, account, job, automationCtx(me));
        job = r.job;
        changed.set(accountId, r.account);
        results.push({ accountName: account.name, results: r.results });
      }
      made.push(job);
    });
    commitAccounts(changed);
    setJobs((list) => [...list, ...made]);
    return { jobs: made, results };
  }, [accounts, pipelines, chatTemplates, emailTemplates, organizerTemplates, proposalTemplates, invoiceTemplates, folderTemplates, taskTemplates, clientFacingJobs, tagById]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Update a job (no automations). Returns the id. */
  const saveJob = useCallback((job) => {
    const now = new Date().toISOString();
    if (job.id) {
      setJobs((list) => list.map((j) => (j.id === job.id ? { ...j, ...job, updatedAt: now } : j)));
      return job.id;
    }
    const id = uid("job");
    setJobs((list) => [...list, { ...job, id, createdAt: now, enteredStageAt: now, updatedAt: now, activity: [] }]);
    return id;
  }, []);

  /** Move a job to another stage and run that stage's automations for its account. Returns the results. */
  const moveJob = useCallback((id, stageId, { me, run = true } = {}) => {
    const job = jobs.find((j) => j.id === id);
    if (!job || job.stageId === stageId) return [];
    const now = new Date().toISOString();
    let next = { ...job, stageId, enteredStageAt: now, updatedAt: now };
    const autos = run ? (stageOf(job.pipelineId, stageId)?.automations || []) : [];
    const account = accounts.find((a) => a.id === job.accountId);
    let results = [];
    if (autos.length && account) {
      const r = runAutomations(autos, account, next, automationCtx(me));
      next = r.job;
      results = r.results;
      commitAccounts(new Map([[account.id, r.account]]));
    }
    setJobs((list) => list.map((j) => (j.id === id ? next : j)));
    return results;
  }, [jobs, accounts, pipelines, chatTemplates, emailTemplates, organizerTemplates, proposalTemplates, invoiceTemplates, folderTemplates, taskTemplates, clientFacingJobs, tagById]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteJobs = useCallback((ids) => setJobs((list) => list.filter((j) => !ids.includes(j.id))), []);

  /* ---------- Pipelines ---------- */
  /** Returns true if another pipeline already has this name. */
  const pipelineNameTaken = useCallback(
    (name, exceptId) => pipelines.some((p) => p.id !== exceptId && sameName(p.pipelineName, name)),
    [pipelines],
  );

  /** Create (no id) or update (with id). Returns the saved pipeline. */
  const savePipeline = useCallback((pipeline) => {
    const rec = {
      ...pipeline,
      id: pipeline.id || uid("pl"),
      pipelineName: pipeline.pipelineName.trim(),
      stages: pipeline.stages.map((s) => ({ ...s, name: s.name.trim() })),
      updatedAt: new Date().toISOString(),
    };
    setPipelines((list) => (list.some((p) => p.id === rec.id) ? list.map((p) => (p.id === rec.id ? rec : p)) : [rec, ...list]));
    return rec;
  }, []);

  /** Copy a pipeline with new ids for it, its stages and automations. Returns the copy. */
  const duplicatePipeline = useCallback(
    (id) => {
      const src = pipelines.find((p) => p.id === id);
      if (!src) return null;
      const name = copyName(src.pipelineName, (n) => pipelines.some((p) => sameName(p.pipelineName, n)));
      const copy = {
        ...JSON.parse(JSON.stringify(src)),
        id: uid("pl"),
        pipelineName: name,
        stages: src.stages.map((s) => ({
          ...JSON.parse(JSON.stringify(s)),
          id: uid("stage"),
          automations: (s.automations || []).map((a) => ({ ...a, id: uid("auto") })),
        })),
        updatedAt: new Date().toISOString(),
      };
      setPipelines((list) => [copy, ...list]);
      return copy;
    },
    [pipelines],
  );

  const deletePipelines = useCallback(
    (ids) => setPipelines((list) => list.filter((p) => !ids.includes(p.id))),
    [],
  );

  /* ---------- Service categories ---------- */
  /** Returns true if another category already has this name. */
  const serviceCategoryNameTaken = useCallback(
    (name, exceptId) => serviceCategories.some((c) => c.id !== exceptId && sameName(c.name, name)),
    [serviceCategories],
  );

  /** Create (no id) or update (with id). Returns the saved category. */
  const saveServiceCategory = useCallback(({ id, name, description = "" }) => {
    const rec = { id: id || uid("cat"), name: name.trim(), description: description.trim() };
    setServiceCategories((list) => (id ? list.map((c) => (c.id === id ? { ...c, ...rec } : c)) : [...list, rec]));
    return rec;
  }, []);

  /** Delete categories; their services stay, with no category. */
  const deleteServiceCategories = useCallback((ids) => {
    setServiceCategories((list) => list.filter((c) => !ids.includes(c.id)));
    setServices((list) => list.map((s) => (ids.includes(s.categoryId) ? { ...s, categoryId: null } : s)));
  }, []);

  /* ---------- Services ---------- */
  /** Look up one service by id (for the edit form). */
  const getService = useCallback((id) => services.find((s) => s.id === id) || null, [services]);

  /** Returns true if another service already has this name. */
  const serviceNameTaken = useCallback(
    (name, exceptId) => services.some((s) => s.id !== exceptId && sameName(s.name, name)),
    [services],
  );

  /** Create a new service. Returns the saved service. */
  const createService = useCallback((service) => {
    const now = new Date().toISOString();
    const rec = {
      ...service,
      id: uid("svc"),
      name: (service.name || "").trim(),
      description: (service.description || "").trim(),
      categoryId: service.categoryId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    setServices((list) => [rec, ...list]);
    return rec;
  }, []);

  /** Edit an existing service (only the fields passed in change). Returns the updated service, or null if not found. */
  const updateService = useCallback(
    (id, changes) => {
      const current = services.find((s) => s.id === id);
      if (!current) return null;
      const rec = {
        ...current,
        ...changes,
        id,
        name: (changes.name ?? current.name ?? "").trim(),
        description: (changes.description ?? current.description ?? "").trim(),
        updatedAt: new Date().toISOString(),
      };
      setServices((list) => list.map((s) => (s.id === id ? rec : s)));
      return rec;
    },
    [services],
  );

  /** Create (no id) or update (with id). Returns the saved service. Kept so existing forms keep working. */
  const saveService = useCallback(
    (service) => (service.id ? updateService(service.id, service) : createService(service)),
    [createService, updateService],
  );

  /** Copy services with new ids and unique "(copy)" names; copies go to the top of the list. Returns the copies. */
  const duplicateServices = useCallback(
    (ids) => {
      const now = new Date().toISOString();
      const usedNames = services.map((s) => s.name);
      const copies = services
        .filter((s) => ids.includes(s.id))
        .map((s) => {
          const name = copyName(s.name, (n) => usedNames.some((u) => sameName(u, n)));
          usedNames.push(name);
          return { ...JSON.parse(JSON.stringify(s)), id: uid("svc"), name, createdAt: now, updatedAt: now };
        });
      if (copies.length) setServices((list) => [...copies, ...list]);
      return copies;
    },
    [services],
  );

  /** Delete one or more services. */
  const deleteServices = useCallback(
    (ids) => setServices((list) => list.filter((s) => !ids.includes(s.id))),
    [],
  );

  /** Move services into a category (pass null to remove them from their category). */
  const moveServicesToCategory = useCallback((ids, categoryId) => {
    setServices((list) => list.map((s) => (ids.includes(s.id) ? { ...s, categoryId, updatedAt: new Date().toISOString() } : s)));
  }, []);

  /* ---------- Accounts & contacts ---------- */
  /** Add an account from the Add account drawer's form. Returns the new account. */
  const addAccount = useCallback((form) => {
    const name = (form.name || "").trim() || "New account";
    const rec = {
      id: `AC-${Date.now().toString(36).toUpperCase()}`,
      name,
      company: form.company || "",
      email: form.email || "",
      owner: "",
      team: form.team || [],
      tags: form.tags || [],
      contacts: form.contacts || [],
      role: form.role || "Editor",
      status: form.status || "Active",
      plan: form.plan || "Pro",
      joined: today(),
    };
    setAccounts((list) => [rec, ...list]);
    return rec;
  }, []);

  /** Delete tags and remove them from every account and contact. */
  const deleteTags = useCallback((ids) => {
    setTags((list) => list.filter((t) => !ids.includes(t.value)));
    setAccounts((list) => list.map((a) => ({ ...a, tags: (a.tags || []).filter((id) => !ids.includes(id)) })));
    setContacts((list) => list.map((c) => ({ ...c, tags: (c.tags || []).filter((id) => !ids.includes(id)) })));
  }, []);

  /** Create (no id) or update (with id) a contact. Returns the contact id. */
  const saveContact = useCallback((contact) => {
    if (contact.id) {
      setContacts((list) => list.map((c) => (c.id === contact.id ? { ...c, ...contact } : c)));
      return contact.id;
    }
    const id = `CT-${Date.now().toString(36).toUpperCase()}`;
    setContacts((list) => [{ ...contact, id, createdAt: today() }, ...list]);
    return id;
  }, []);
  const deleteContacts = useCallback(
    (ids) => setContacts((list) => list.filter((c) => !ids.includes(c.id))),
    [],
  );

  const value = useMemo(
    () => ({
      accounts, setAccounts, tags, tagById, tagUsage, nameTaken, saveTag, createTag, recolorTags, deleteTags,
      contacts, setContacts, saveContact, deleteContacts, addAccount,
      taskTemplates, saveTaskTemplate, duplicateTaskTemplates, deleteTaskTemplates,
      emailTemplates, saveEmailTemplate, duplicateEmailTemplates, deleteEmailTemplates,
      clientFacingJobs, setClientFacingJobs, clientFacingJobNameTaken, saveClientFacingJob, createClientFacingJob, recolorClientFacingJobs, deleteClientFacingJobs,
      jobTemplates, saveJobTemplate, duplicateJobTemplates, deleteJobTemplates,
      pipelines, pipelineNameTaken, savePipeline, duplicatePipeline, deletePipelines,
      jobs, createJobs, saveJob, moveJob, deleteJobs,
      services, getService, serviceNameTaken, createService, updateService, saveService, duplicateServices, deleteServices, moveServicesToCategory,
      serviceCategories, serviceCategoryNameTaken, saveServiceCategory, deleteServiceCategories,
      chatTemplates, saveChatTemplate, duplicateChatTemplates, deleteChatTemplates, chatTemplateNameTaken,
      invoiceTemplates, saveInvoiceTemplate, duplicateInvoiceTemplates, deleteInvoiceTemplates, invoiceTemplateNameTaken,
      proposalTemplates, saveProposalTemplate, duplicateProposalTemplates, deleteProposalTemplates, proposalTemplateNameTaken,
      organizerTemplates, saveOrganizerTemplate, duplicateOrganizerTemplates, deleteOrganizerTemplates, organizerTemplateNameTaken,
      folderTemplates, saveFolderTemplate, duplicateFolderTemplates, deleteFolderTemplates, folderTemplateNameTaken,
    }),
    [
      accounts, tags, tagById, tagUsage, nameTaken, saveTag, createTag, recolorTags, deleteTags,
      contacts, saveContact, deleteContacts, addAccount,
      taskTemplates, saveTaskTemplate, duplicateTaskTemplates, deleteTaskTemplates,
      emailTemplates, saveEmailTemplate, duplicateEmailTemplates, deleteEmailTemplates,
      clientFacingJobs, clientFacingJobNameTaken, saveClientFacingJob, createClientFacingJob, recolorClientFacingJobs, deleteClientFacingJobs,
      jobTemplates, saveJobTemplate, duplicateJobTemplates, deleteJobTemplates,
      pipelines, pipelineNameTaken, savePipeline, duplicatePipeline, deletePipelines,
      jobs, createJobs, saveJob, moveJob, deleteJobs,
      services, getService, serviceNameTaken, createService, updateService, saveService, duplicateServices, deleteServices, moveServicesToCategory,
      serviceCategories, serviceCategoryNameTaken, saveServiceCategory, deleteServiceCategories,
      chatTemplates, saveChatTemplate, duplicateChatTemplates, deleteChatTemplates, chatTemplateNameTaken,
      invoiceTemplates, saveInvoiceTemplate, duplicateInvoiceTemplates, deleteInvoiceTemplates, invoiceTemplateNameTaken,
      proposalTemplates, saveProposalTemplate, duplicateProposalTemplates, deleteProposalTemplates, proposalTemplateNameTaken,
      organizerTemplates, saveOrganizerTemplate, duplicateOrganizerTemplates, deleteOrganizerTemplates, organizerTemplateNameTaken,
      folderTemplates, saveFolderTemplate, duplicateFolderTemplates, deleteFolderTemplates, folderTemplateNameTaken,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);