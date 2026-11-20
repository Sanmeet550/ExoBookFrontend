import { createContext, useContext, useSyncExternalStore } from 'react';

/**
 * Minimal URL router for ExoBook (no extra dependency).
 *
 * The current screen lives in the URL path, so a browser refresh, a pasted link and the
 * Back/Forward buttons all restore the same module, view and record:
 *
 *   /<resource>[/<recordId>|/new]
 *   e.g.  /sales/orders/15   /crm/leads/28   /contacts/12   /helpdesk/tickets/42
 *
 * Hosting: every unknown path must serve index.html (the Vite dev server does this already).
 */
const listeners = new Set();
const currentPath = () => window.location.pathname.replace(/^\/+|\/+$/g, '');
const notify = () => listeners.forEach((listener) => listener());

window.addEventListener('popstate', notify);

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const toPath = (segments) => segments.filter((s) => s !== null && s !== undefined && s !== '').map(encodeURIComponent).join('/');
export const toSegments = (path) => (path ? path.split('/').map(decodeURIComponent) : []);

/** Navigates to a list of path segments. `replace` swaps the current history entry instead of adding one. */
export const navigate = (segments, { replace = false } = {}) => {
  const path = toPath(segments);
  if (path === currentPath()) return;
  window.history[replace ? 'replaceState' : 'pushState'](null, '', `/${path}`);
  notify();
};

/** Current route as path segments, re-rendering the component whenever the URL changes. */
export const useRoute = () => toSegments(useSyncExternalStore(subscribe, currentPath));

/**
 * Base path of the screen being rendered (e.g. ['master', 'contacts']). App provides it, so
 * list/form screens can read and write "their" record id without knowing where they are mounted.
 */
export const RouteBaseContext = createContext([]);
export const useRouteBase = () => useContext(RouteBaseContext);
