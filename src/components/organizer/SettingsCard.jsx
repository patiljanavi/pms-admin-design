import { Toggle } from '../ui';

/** A settings block with a title, help text and a switch; extra content shows when it's on. */
export default function SettingsCard({ title, help, checked, onChange, children }) {
  return (
    <section className="rounded-lg border border-line p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold">{title}</div>
          {help && <div className="text-sm text-muted">{help}</div>}
        </div>
        <Toggle label={title} checked={!!checked} onChange={onChange} />
      </div>
      {checked && children && <div className="mt-4 border-t border-line pt-4">{children}</div>}
    </section>
  );
}
