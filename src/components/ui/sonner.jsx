import { useEffect, useRef } from 'react';
import { Toaster as Sonner, toast } from 'sonner';
import { useAppearance } from 'context/AppearanceContext';

/** App-wide toast host (mounted once in index.js). Use `toast('Saved')` from anywhere. */
function Toaster(props) {
  const { resolvedTheme } = useAppearance() || {};
  return (
    <Sonner
      theme={resolvedTheme || 'light'}
      position="bottom-right"
      closeButton
      richColors={false}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast !rounded-lg !border-border !bg-popover !text-popover-foreground !shadow-pop !font-sans',
          description: '!text-muted-foreground',
          actionButton: '!bg-primary !text-primary-foreground',
          cancelButton: '!bg-muted !text-muted-foreground',
          closeButton: '!bg-popover !border-border !text-muted-foreground hover:!text-foreground',
        },
      }}
      {...props}
    />
  );
}

/**
 * Bridge for older screens that keep a `toast` string in state:
 *   {toast && <div role="status">…</div>}  →  <ToastBridge message={toast} />
 * Shows a Sonner toast whenever the message changes to a non-empty value.
 */
function ToastBridge({ message }) {
  const last = useRef('');
  useEffect(() => {
    if (message && message !== last.current) {
      const lower = String(message).toLowerCase();
      const fn = /delet|remov|archiv/.test(lower) ? toast : /fail|error|invalid|couldn/.test(lower) ? toast.error : toast.success;
      fn(message);
    }
    last.current = message || '';
  }, [message]);
  return null;
}

export { Toaster, toast, ToastBridge };
