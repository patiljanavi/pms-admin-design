import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { Modal } from '../ui';

/** What the automations did, per account. groups: [{ accountName, results: [{ ok, text }] }] */
export default function AutomationResultsModal({ title = 'Automations ran', groups, onClose }) {
  return (
    <Modal title={title} onClose={onClose} width="max-w-lg" footer={<button type="button" className="btn-primary" onClick={onClose}>Done</button>}>
      <div className="flex flex-col gap-4">
        {groups.map((g) => (
          <section key={g.accountName} aria-label={`Results for ${g.accountName}`}>
            <h3 className="mb-1.5 font-semibold">{g.accountName}</h3>
            <ul className="flex flex-col gap-1.5">
              {g.results.map((r, i) => (
                <li key={`${r.id}-${i}`} className="flex items-start gap-2 text-sm">
                  {r.ok ? <FiCheckCircle className="mt-0.5 flex-none text-success-700" aria-label="Done" /> : <FiAlertCircle className="mt-0.5 flex-none text-warning-700" aria-label="Skipped" />}
                  <span className={r.ok ? '' : 'text-muted'}>{r.text}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
