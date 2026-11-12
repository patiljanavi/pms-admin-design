import { Outlet, useLocation } from 'react-router-dom';
import { PageHeader } from '../../components/page';
import { TooltipProvider } from '../../components/ui/tooltip';
import { TemplateTypeNav } from './templateKit';

/**
 * Alternate Firm Templates layout (App.js uses FirmTemplatesLayoutold).
 * Same header and type navigation, but create / edit pages show on their own, without the tabs.
 */
export default function FirmTemplatesLayout() {
  const { pathname } = useLocation();

  // Create / edit pages (e.g. /firmtemp/templates/tasks/new) show without the tab bar
  const isFormPage = pathname.split('/').filter(Boolean).length > 3;
  if (isFormPage) return <TooltipProvider delayDuration={300}><div className="page"><Outlet /></div></TooltipProvider>;

  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={150}>
      <div className="page">
        <PageHeader title="Firm Templates" description="Reusable tasks, emails, jobs, documents and more for your whole team." />
        <TemplateTypeNav className="sticky top-[var(--app-header-h,0px)] z-20 -mx-4 bg-canvas/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8" />
        <Outlet />
      </div>
    </TooltipProvider>
  );
}
