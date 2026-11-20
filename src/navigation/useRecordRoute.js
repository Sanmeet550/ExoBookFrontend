import { useEffect, useRef } from 'react';
import { navigate, toPath, useRoute, useRouteBase } from './router';
import { useNotify } from '../context/NotificationContext';

const NEW = 'new';
const UNSYNCED = Symbol('unsynced');
const NO_RECORDS = [];

/**
 * useRecordRoute
 *
 * Keeps a list/form screen and the URL in sync, in both directions, with one call:
 *
 *   useRecordRoute({ viewMode, selectedRecord, data, loading, onOpen: handleOpenForm, onClose: handleBackToList });
 *
 * - Opening a record, pressing New or going back to the list updates the URL
 *   (.../12, .../new, or the list URL). A created record replaces ".../new" with its real id.
 * - Refresh, a pasted link and Back/Forward re-open the record named in the URL, once the
 *   list has loaded. An id that no longer exists shows a notification and returns to the list.
 *
 * Options: primaryKey ('id'); lookup(id) to resolve records that may not be in `data`.
 */
export default function useRecordRoute({
  viewMode,
  selectedRecord,
  data = NO_RECORDS,
  loading = false,
  primaryKey = 'id',
  onOpen,
  onClose,
  lookup,
}) {
  const base = useRouteBase();
  const route = useRoute();
  const notify = useNotify();

  const basePath = toPath(base);
  const isOnBase = toPath(route.slice(0, base.length)) === basePath;
  const urlRecord = isOnBase ? route[base.length] || null : null;

  const recordId = selectedRecord?.[primaryKey];
  const stateRecord = viewMode === 'form' ? (recordId !== undefined && recordId !== null && recordId !== '' ? String(recordId) : NEW) : null;

  const appliedUrl = useRef(UNSYNCED); // last URL value the screen has been brought in line with
  const pending = useRef(null);        // screen state when a URL change was applied; it may take effect later
  const hasLoaded = useRef(false);
  if (loading) hasLoaded.current = true;
  const listReady = hasLoaded.current && !loading;

  useEffect(() => {
    if (!isOnBase) return;

    // 1. The URL changed (refresh, deep link, Back/Forward): bring the screen in line with it.
    if (urlRecord !== appliedUrl.current) {
      if (urlRecord === stateRecord) {
        appliedUrl.current = urlRecord;
      } else if (urlRecord === null) {
        appliedUrl.current = null;
        pending.current = { from: stateRecord };
        onClose?.();
      } else if (urlRecord === NEW) {
        appliedUrl.current = NEW;
        pending.current = { from: stateRecord };
        onOpen?.(null);
      } else {
        const record = lookup ? lookup(urlRecord) : data.find((item) => String(item[primaryKey]) === urlRecord);
        if (record) {
          appliedUrl.current = urlRecord;
          pending.current = { from: stateRecord };
          onOpen?.(record);
        } else if (listReady) {
          appliedUrl.current = null;
          notify.error('This record does not exist or is no longer available.');
          navigate(base, { replace: true });
        }
        // otherwise the list is still loading: try again when it arrives
      }
      return;
    }

    // 2. The screen changed (user opened, created or closed a record): update the URL.
    if (stateRecord === urlRecord) {
      pending.current = null;
      return;
    }
    // A URL change was just applied and the screen has not caught up yet (handlers may be
    // asynchronous, and React can re-run this effect before the new state arrives): wait.
    if (pending.current && pending.current.from === stateRecord) return;
    pending.current = null;
    appliedUrl.current = stateRecord;
    // A new record that just received its id replaces ".../new" instead of adding a history entry.
    navigate(stateRecord ? [...base, stateRecord] : base, { replace: urlRecord === NEW && stateRecord !== null });
    // Handlers are recreated every render; the effect is driven by the values below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnBase, urlRecord, stateRecord, listReady, data]);
}
