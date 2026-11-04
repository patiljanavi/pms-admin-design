import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import AccountGeneralStep from '../../components/Proposal/AccountGeneralStep';
import ProposalWizard from '../../components/Proposal/ProposalWizard';
import { Modal } from '../../components/ui';
import { useData } from '../../context/DataContext';
import { accountTabPath } from '../../config';
import { demoProposals, emptyAccountProposal, newProposalId, proposalDisplayName, validateAccountProposalStep } from '../../data/accountProposals';

const clone = (o) => JSON.parse(JSON.stringify(o));

/**FsavF
 * Create / edit a proposal for an account — a full page inside the account dashboard.
 *   /clients/accounts/accountsdash/proposals/:accountId/new           → create
 *   /clients/accounts/accountsdash/proposals/:accountId/:proposalId   → edit
 * Steps: General (Account · Template · Proposal name · Team) · Introduction · Terms · Services & Invoices · Payment
 */
export default function AccountProposalForm() {
  const { proposalId } = useParams();
  const { account } = useOutletContext();
  return <ProposalPage key={proposalId || 'new'} account={account} proposalId={proposalId} />;
}

function ProposalPage({ account, proposalId }) {
  const navigate = useNavigate();
  const { state: routeState, pathname } = useLocation();
  const { accounts = [], setAccounts, proposalTemplates = [] } = useData();
  const listOf = (a) => a.proposals ?? demoProposals(a, proposalTemplates);
  const existing = proposalId ? listOf(account).find((p) => p.id === proposalId) : null;
  const isEditing = !!existing;
  const back = accountTabPath('proposals', account.id);

  const initial = useMemo(() => (existing ? clone(existing) : emptyAccountProposal(account)), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [formData, setFormData] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const dirty = JSON.stringify(formData) !== JSON.stringify(saved);
  const updateFormData = (section, newData) => setFormData((prev) => ({ ...prev, [section]: { ...prev[section], ...newData } }));
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2400); };

  // message passed along when a new draft opens as its edit page
  useEffect(() => {
    if (routeState?.toast) { notify(routeState.toast); navigate(pathname, { replace: true, state: null }); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (proposalId && !existing) {
    return (
      <div className="card flex flex-col items-start gap-4 p-6">
        <h2 className="text-2xl font-bold">Proposal not found</h2>
        <Link to={back} className="btn-primary">Back to proposals</Link>
      </div>
    );
  }

  /** Save on the chosen account (moves it if the account was changed). send = true → status "sent". */
  const onSave = (send) => {
    const targetId = formData.general.accountId;
    const now = new Date().toISOString();
    const rec = {
      ...formData,
      id: existing?.id || newProposalId(),
      status: send ? 'sent' : (existing?.status || 'draft'),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      ...(send ? { sentAt: now } : {}),
    };
    setAccounts((list) => list.map((a) => {
      const others = listOf(a).filter((p) => p.id !== rec.id);
      if (a.id === targetId) return { ...a, proposals: [rec, ...others] };
      if (a.proposals || a.id === account.id) return { ...a, proposals: others };   // removed from its old account
      return a;
    }));
    const target = accounts.find((a) => a.id === targetId) || account;
    const name = proposalDisplayName(rec, target);
    if (send || targetId !== account.id) {
      navigate(accountTabPath('proposals', targetId), { state: { toast: send ? `Proposal sent: “${name}”` : `Saved “${name}” to ${target.name}` } });
      return;
    }
    if (!isEditing) { navigate(`${back}/${rec.id}`, { replace: true, state: { toast: 'Proposal saved as a draft' } }); return; }
    setFormData(rec); setSaved(rec);
    notify('Proposal updated');
  };
  const onCancel = () => (dirty ? setModal('discard') : navigate(back));

  return (
    <div className="flex flex-col gap-6">
      <ProposalWizard formData={formData} updateFormData={updateFormData} validate={validateAccountProposalStep}
        onSave={onSave} onCancel={onCancel} isEditing={isEditing} dirty={dirty} draftSteps={['general']}
        saveLabel={isEditing ? 'Update' : 'Save draft'} submitLabel={existing?.status === 'sent' || existing?.status === 'signed' ? 'Update & send' : 'Send proposal'}
        renderGeneral={(props) => <AccountGeneralStep {...props} setFormData={setFormData} />}
        renderHeader={({ step, total, name }) => (
          <div className="flex items-center gap-3">
            <button onClick={onCancel} aria-label="Back to proposals" className="flex h-10 w-10 flex-none items-center justify-center rounded border border-line-strong bg-surface hover:bg-subtle"><FiArrowLeft size={18} /></button>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold">{isEditing ? `Edit proposal: ${proposalDisplayName(saved, account)}` : 'Create proposal'}</h2>
              <p className="text-sm text-muted">Step {step} of {total} · {name}</p>
            </div>
          </div>
        )} />

      {modal === 'discard' && (
        <Modal title="Discard changes?" onClose={() => setModal(null)}
          footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Keep editing</button><button className="btn bg-danger-700 text-white hover:bg-[#831E15]" onClick={() => navigate(back)}>Discard</button></>}>
          <p className="text-muted">Your changes to this proposal haven't been saved.</p>
        </Modal>
      )}
      {toast && <div role="status" className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-md bg-ink px-5 py-3 font-semibold text-white">{toast}</div>}
    </div>
  );
}