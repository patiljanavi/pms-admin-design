import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, FileX2, Trash2 } from 'lucide-react';
import AccountGeneralStep from '../../components/Proposal/AccountGeneralStep';
import ProposalWizard from '../../components/Proposal/ProposalWizard';
import { Modal } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { SimpleTooltip } from '../../components/ui/tooltip';
import { EmptyState } from '../../components/page';
import { useData } from '../../context/DataContext';
import { accountTabPath } from '../../config';
import { PROPOSAL_STATUS, demoProposals, emptyAccountProposal, newProposalId, proposalDisplayName, validateAccountProposalStep } from '../../data/accountProposals';
import { ToastBridge } from '../../components/ui/sonner';

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
      <div className="rounded-xl border bg-card shadow-card">
        <EmptyState icon={FileX2} title="Proposal not found" description="It may have been deleted, or moved to another account."
          action={<Button asChild><Link to={back}><ArrowLeft />Back to proposals</Link></Button>} />
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
          <div className="flex items-start gap-3">
            <SimpleTooltip label="Back to proposals">
              <Button variant="ghost" size="icon-sm" onClick={onCancel} aria-label="Back to proposals" className="-ml-1 mt-0.5 text-muted-foreground"><ArrowLeft /></Button>
            </SimpleTooltip>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-2xl font-semibold tracking-tight">{isEditing ? proposalDisplayName(saved, account) : 'New proposal'}</h2>
                {isEditing && <Badge variant={{ draft: 'neutral', sent: 'info', signed: 'success' }[existing.status] || 'neutral'} dot>{(PROPOSAL_STATUS[existing.status] || PROPOSAL_STATUS.draft).label}</Badge>}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{isEditing ? 'Edit proposal' : `For ${account.name}`} · Step {step} of {total} · <span className="font-medium text-foreground">{name}</span></p>
            </div>
          </div>
        )} />

      {modal === 'discard' && (
        <Modal title="Discard changes?" onClose={() => setModal(null)}
          description="Your changes to this proposal haven't been saved."
          footer={<><Button variant="outline" onClick={() => setModal(null)}>Keep editing</Button><Button variant="destructive" onClick={() => navigate(back)}><Trash2 />Discard changes</Button></>}>
          <p className="text-sm text-muted-foreground">If you leave now, everything since your last save is lost.</p>
        </Modal>
      )}
      <ToastBridge message={toast} />
    </div>
  );
}