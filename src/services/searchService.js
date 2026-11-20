import apiClient from './apiClient';

/**
 * Search Service
 *
 * Supplies the Odoo-style search bar with:
 * - the fields of a model, from the model registry (GET /ir_model_field/view/all?model_name=)
 * - display names of related records, to search relational fields by name
 *   (GET /ir_model/names/{model}?ids=1,2,3)
 * Both are cached for the browser session.
 */
const fieldCache = new Map(); // model -> Promise<fields[]>
const nameCache = new Map(); // model -> Map<id, name>

export const searchService = {
  fields(model) {
    if (!fieldCache.has(model)) {
      const request = apiClient.get('/ir_model_field/view/all', { params: { model_name: model } }).catch((err) => {
        fieldCache.delete(model); // retry next time (e.g. registry not migrated yet)
        throw err;
      });
      fieldCache.set(model, request);
    }
    return fieldCache.get(model);
  },

  /** Returns Map<id, name> for the given ids, fetching only the ones not cached yet. */
  async names(model, ids) {
    if (!nameCache.has(model)) nameCache.set(model, new Map());
    const cache = nameCache.get(model);
    const missing = [...new Set(ids)].filter((id) => id !== null && id !== undefined && !cache.has(id));
    for (let i = 0; i < missing.length; i += 500) {
      const chunk = missing.slice(i, i + 500);
      const rows = await apiClient.get(`/ir_model/names/${model}`, { params: { ids: chunk.join(',') } });
      chunk.forEach((id) => cache.set(id, null)); // not visible / deleted: don't ask again
      rows.forEach((row) => cache.set(row.id, row.name));
    }
    return cache;
  },

  clear() {
    fieldCache.clear();
    nameCache.clear();
  },
};

export default searchService;
