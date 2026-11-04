import { FiMenu, FiPlus } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import GlobalSearch from './GlobalSearch';
import { Avatar, cx, initials } from './ui';

/** Top bar: (menu + logo on phones) · search · + New · user. */
export default function Header({ onMenu, menuOpen, onQuickCreate, quickOpen }) {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-surface px-3 py-2.5 sm:gap-3 sm:px-6 lg:px-10">
      {/* Phones / tablets only */}
      <button onClick={onMenu} aria-label="Open menu" aria-expanded={menuOpen} className="flex h-10 w-10 flex-none items-center justify-center rounded hover:bg-subtle lg:hidden"><FiMenu size={20} /></button>
      <div className="flex flex-1 items-center gap-2.5 lg:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded bg-brand-600 font-bold text-white">H</span>
        <span className="text-md font-bold">Harbor</span>
      </div>

      <GlobalSearch />

      <div className="ml-auto flex flex-none items-center gap-2 sm:gap-3">
        <button type="button" onClick={onQuickCreate} aria-expanded={quickOpen} aria-label="Quick create"
          className={cx('btn-primary min-h-[40px] px-3 sm:px-4', quickOpen && 'bg-brand-700')}>
          <FiPlus size={18} aria-hidden="true" /><span className="hidden sm:inline">New</span>
        </button>
        <span title={user?.email} className="hidden sm:block"><Avatar text={initials(user?.name || user?.email || '?')} tone="dark" /></span>
      </div>
    </header>
  );
}
