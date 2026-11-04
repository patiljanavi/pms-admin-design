/** Split layout used by Login and Register: brand panel + form area. */
export default function AuthShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface lg:flex-row">
      <aside className="flex flex-col gap-7 bg-brand-600 px-6 py-8 text-white sm:px-12 lg:w-[44%] lg:max-w-[560px] lg:py-12">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded bg-white font-bold text-brand-600">H</span>
          <span className="text-lg font-bold">Harbor Admin</span>
        </div>
        <div className="hidden lg:mt-auto lg:block">
          <h1 className="text-4xl font-bold">Run accounts, billing and projects from one place.</h1>
          <ul className="mt-7 flex flex-col gap-3.5 text-[#DCE6FD]">
            <li className="flex gap-2.5"><span className="font-bold text-white">✓</span>Tables with filters, search and pagination</li>
            <li className="flex gap-2.5"><span className="font-bold text-white">✓</span>Kanban boards for every team</li>
            <li className="flex gap-2.5"><span className="font-bold text-white">✓</span>Role-based access and audit history</li>
          </ul>
        </div>
        <div className="hidden text-sm text-[#B9CCFA] lg:block">© 2026 Harbor</div>
      </aside>
      <main className="flex flex-1 justify-center px-5 py-10 sm:px-8 lg:items-start lg:py-14">{children}</main>
    </div>
  );
}
