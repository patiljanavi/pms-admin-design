/**
 * Turns DataContext's client-facing statuses into dropdown options.
 * Works with clientFacingJobs ({ value, label, color, description }) and other shapes
 * ({ id, name, clientfacingColour, clientfacingDescription, stage, … }).
 * Returns [{ id, name, color, description, stage? }].
 */
const pick = (obj, keys) => keys.map((k) => obj?.[k]).find((v) => v !== undefined && v !== null && v !== '');
export function statusOptionsFrom(list = []) {
  const options = (list || []).map((s) => ({
    id: pick(s, ['value', 'id', '_id']),
    name: pick(s, ['label', 'name', 'title', 'clientfacingName']) || '',
    color: pick(s, ['color', 'colour', 'clientfacingColour', 'clientfacingColor']) || '#475569',
    description: String(pick(s, ['description', 'clientfacingDescription', 'clientfacingdescription', 'clientFacingDescription', 'clientDescription', 'desc', 'message']) || ''),
    stage: s?.stage,
  }));
  return options.some((o) => o.stage != null) ? options.sort((a, b) => (a.stage ?? 999) - (b.stage ?? 999)) : options;
}

/** Turns any template list into { id, label } options (templatename / templateName / name). */
export const templateOptionsFrom = (list = []) => (list || []).map((t) => ({
  id: t.id ?? t._id ?? t.value,
  label: t.templatename ?? t.templateName ?? t.name ?? t.label ?? 'Untitled',
}));