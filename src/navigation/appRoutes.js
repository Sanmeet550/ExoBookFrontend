import { menuConfig } from '../config/menuConfig';
import { toPath } from './router';

/**
 * URL <-> screen mapping, built from menuConfig (path / tabPaths / submenu path).
 *
 * resolveRoute(['crm', 'leads', '28']) ->
 *   { menuId: 'crm', subId: null, moduleKey: 'crm', title: 'CRM', tab: 'lead', base: ['crm', 'leads'], matched: true }
 * `base` is the screen's own URL; a record id or "new" follows it.
 */
const startsWith = (segments, prefix) => prefix.length > 0 && toPath(segments.slice(0, prefix.length)) === toPath(prefix);

/** Every addressable screen, longest path first so the most specific match wins. */
const screens = menuConfig
  .flatMap((menu) => {
    if (menu.hasSubmenu) {
      return menu.submenus.map((sub) => ({
        prefix: sub.path, base: sub.path, view: { menuId: menu.id, subId: sub.id, moduleKey: sub.moduleKey, title: sub.label, tab: null },
      }));
    }
    if (menu.tabPaths) {
      return Object.entries(menu.tabPaths).map(([tab, slug]) => ({
        prefix: [...menu.path, slug], base: [...menu.path, slug], view: { menuId: menu.id, subId: null, moduleKey: menu.viewKey, title: menu.label, tab },
      }));
    }
    return [{ prefix: menu.path, base: menu.path, view: { menuId: menu.id, subId: null, moduleKey: menu.viewKey, title: menu.label, tab: null } }];
  })
  .sort((a, b) => b.prefix.length - a.prefix.length);

/** URL of a menu entry, a submenu (by id) or a module tab (by tab id). */
export const menuPath = (menu, childId = null) => {
  if (menu.hasSubmenu) {
    const sub = menu.submenus.find((item) => item.id === childId) || menu.submenus[0];
    return sub.path;
  }
  if (menu.tabPaths) return [...menu.path, menu.tabPaths[childId || menu.defaultTab]];
  return menu.path;
};

/** URL of a module tab, e.g. tabPath('helpdesk', 'allTickets') -> ['helpdesk', 'tickets']. */
export const tabPath = (menuId, tabId) => menuPath(menuConfig.find((menu) => menu.id === menuId), tabId);

export const resolveRoute = (segments) => {
  const screen = screens.find((item) => startsWith(segments, item.prefix));
  if (screen) return { ...screen.view, base: screen.base, matched: true };
  // A module URL without a tab (e.g. /crm) or an unknown URL opens a default screen and is
  // corrected in the address bar (matched: false).
  const menu = menuConfig.find((item) => item.path && startsWith(segments, item.path)) || menuConfig[0];
  const base = menuPath(menu);
  const fallback = screens.find((item) => toPath(item.base) === toPath(base));
  return { ...fallback.view, base, matched: false };
};
