import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';

const NotificationContext = createContext(null);

export const MESSAGES = {
  created: 'Record created successfully.',
  updated: 'Record updated successfully.',
  deleted: 'Record deleted successfully.',
  archived: 'Record archived successfully.',
};

/**
 * NotificationProvider
 *
 * The one toast used across ExoBook: small, bottom-right, auto-dismissing. Only one toast is
 * visible at a time, so repeating a message refreshes it instead of stacking duplicates.
 *
 *   const notify = useNotify();
 *   notify.success(MESSAGES.created);   notify.error(err.message);
 */
export function NotificationProvider({ children }) {
  const [toast, setToast] = useState(null);

  const show = useCallback((severity, message) => {
    if (message) setToast({ severity, message, key: Date.now() });
  }, []);

  const api = useMemo(
    () => ({
      success: (message) => show('success', message),
      error: (message) => show('error', message),
      info: (message) => show('info', message),
    }),
    [show]
  );

  const close = (_event, reason) => {
    if (reason !== 'clickaway') setToast(null);
  };

  return (
    <NotificationContext.Provider value={api}>
      {children}
      <Snackbar
        key={toast?.key}
        open={Boolean(toast)}
        autoHideDuration={toast?.severity === 'error' ? 6000 : 3000}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={close} severity={toast?.severity || 'success'} variant="filled" sx={{ fontSize: '0.75rem', py: 0.25, alignItems: 'center' }}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotify must be used within a NotificationProvider');
  }
  return context;
}

/**
 * Record to keep showing after a save: the backend's answer when it returned one, otherwise
 * the submitted values. Returns null when a created record has no id to stay on.
 */
export const savedRecordOf = (response, payload, previous, primaryKey = 'id') => {
  const hasId = (record) => record && typeof record === 'object' && record[primaryKey] !== undefined && record[primaryKey] !== null;
  if (hasId(response)) return { ...(previous || {}), ...response };
  const fallback = { ...(previous || {}), ...(payload || {}) };
  return hasId(fallback) ? fallback : null;
};
