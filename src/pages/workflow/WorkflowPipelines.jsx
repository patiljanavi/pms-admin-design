import { useMemo, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { FiArrowRight, FiSearch, FiZap } from 'react-icons/fi';
import { Avatar, initials } from '../../components/ui';
import { useData } from '../../context/DataContext';
import { WORKFLOW_PIPELINES_PATH } from '../../config';

/** Route wrapper: /pipelines shows the list; /pipelines/:pipelineId shows the board. */
export function WorkflowPipelinesLayout() { return <Outlet />; }

/** Workflow → Pipelines: every pipeline (from Pipeline Templates) with its stages and job counts. */
export default function WorkflowPipelines() {
  const { pipelines = [], jobs = [] } = useData();
  const [q, setQ] = useState('');
  const shown = useMemo(() => pipelines.filter((p) => !q.trim() || `${p.pipelineName} ${p.stages.map((s) => s.name).join(' ')}`.toLowerCase().includes(q.trim().toLowerCase())), [pipelines, q]);
  const jobsIn = (p) => jobs.filter((j) => j.pipelineId === p.id);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <nav aria-label="Breadcrumb" className="text-sm text-muted">Workflow <span aria-hidden="true">/</span> Pipelines</nav>
          <h1 className="mt-1 text-3xl font-bold">Pipelines</h1>
          <p className="mt-1 text-muted">Open a pipeline to see its jobs on a Kanban board.</p>
        </div>
        <Link to="/firmtemp/pipelines" className="btn-secondary">Manage pipeline templates</Link>
      </header>

      <label className="flex min-h-[44px] max-w-md items-center gap-2 rounded border border-line-strong bg-surface px-3 focus-within:border-brand-600">
        <FiSearch className="text-muted" aria-hidden="true" /><span className="sr-only">Search pipelines</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pipeline or stage" className="min-w-0 flex-1 bg-transparent outline-none" />
      </label>

      <ul aria-label="Pipelines" className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {shown.map((p) => {
          const list = jobsIn(p);
          const automations = p.stages.reduce((n, s) => n + (s.automations?.length || 0), 0);
          return (
            <li key={p.id}>
              <Link to={`${WORKFLOW_PIPELINES_PATH}/${p.id}`} aria-label={`Open ${p.pipelineName} board`}
                className="group flex h-full flex-col gap-4 rounded-lg border border-line bg-surface p-5 shadow-card transition-shadow hover:border-brand-600 hover:shadow-pop">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold group-hover:text-brand-600">{p.pipelineName}</h2>
                    <p className="text-sm text-muted">{p.stages.length} stages · {list.length} job{list.length === 1 ? '' : 's'}{automations ? ` · ${automations} automations` : ''}</p>
                  </div>
                  <FiArrowRight className="mt-1 text-muted group-hover:text-brand-600" aria-hidden="true" />
                </div>
                {/* stages with how many jobs are in each */}
                <ol className="flex flex-wrap items-center gap-1 text-xs">
                  {p.stages.map((s, i) => {
                    const n = list.filter((j) => j.stageId === s.id).length;
                    return (
                      <li key={s.id} className="flex items-center gap-1">
                        {i > 0 && <span className="text-line-strong" aria-hidden="true">→</span>}
                        <span className="flex items-center gap-1 rounded bg-subtle px-1.5 py-0.5">{s.name}<span className="rounded-full bg-surface px-1.5 font-bold">{n}</span></span>
                      </li>
                    );
                  })}
                </ol>
                {/* progress across stages */}
                <div className="flex h-2 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
                  {p.stages.map((s, i) => {
                    const n = list.filter((j) => j.stageId === s.id).length;
                    return n ? <span key={s.id} style={{ width: `${(n / list.length) * 100}%`, opacity: 0.35 + (0.65 * (i + 1)) / p.stages.length }} className="bg-brand-600" /> : null;
                  })}
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 text-sm text-muted">
                  {(p.availableto || []).length ? (
                    <span className="flex -space-x-2" title={p.availableto.join(', ')}>
                      {p.availableto.slice(0, 4).map((n) => <span key={n} className="rounded-full ring-2 ring-surface"><Avatar text={initials(n)} size="sm" tone="solid" /></span>)}
                    </span>
                  ) : <span>Everyone</span>}
                  {automations > 0 && <span className="flex items-center gap-1"><FiZap className="text-warning-700" aria-hidden="true" /> Automated</span>}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {!shown.length && (
        <div className="rounded-lg border border-dashed border-line-strong p-10 text-center text-muted">
          {pipelines.length ? 'No pipelines match your search.' : <>No pipelines yet. <Link to="/firmtemp/pipelines/new" className="btn-link">Create a pipeline template</Link></>}
        </div>
      )}
    </div>
  );
}
