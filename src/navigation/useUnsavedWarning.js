import { useEffect } from 'react';

/** Asks the browser to confirm a refresh or tab close while a form has unsaved changes. */
export default function useUnsavedWarning(isDirty) {
  useEffect(() => {
    if (!isDirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);
}
