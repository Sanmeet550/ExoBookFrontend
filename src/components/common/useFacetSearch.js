import { useCallback, useEffect, useMemo, useState } from 'react';
import { searchService } from '../../services/searchService';
import { toChatterModel } from '../../services/chatterService';

const SEARCHABLE_TYPES = new Set(['text', 'number', 'selection', 'many2one', 'many2many']);
const HIDDEN_FIELDS = /^(id|created_at|updated_at|active|create_uid|write_uid)$|password|passwd|token|secret/i;
const FIRST_FIELDS = ['name', 'subject', 'title'];

const storageKeyOf = (config) =>
  `exobook_search_${[config.modelName || config.model || '', config.title || ''].join('_').toLowerCase().replace(/\s+/g, '_')}`;

/** Backend model behind a view config: explicit registryModel, chatterModel, or the config's model key. */
export const registryModelOf = (config) => config.registryModel || config.chatterModel || toChatterModel(config.model);

const readFacets = (key) => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const selectionLabels = (field) =>
  Object.fromEntries(
    (field.selection || '').split(';').map((pair) => pair.trim()).filter(Boolean).map((pair) => {
      const [value, ...label] = pair.split(':');
      return [value, label.join(':') || value];
    })
  );

const baseName = (name) => name.replace(/_ids?$/, '');

/** Searchable text of one field of one record (names for relations, labels for selections). */
const textOf = (field, row, names) => {
  const value = row[field.name];
  if (value === null || value === undefined) return '';
  const relatedName = (id) =>
    names[field.relation]?.get(id) ?? row[`${baseName(field.name)}_name`] ?? row[`${field.name}_name`] ?? '';
  switch (field.type) {
    case 'many2one':
      return String(relatedName(value));
    case 'many2many':
      return (Array.isArray(value) ? value : [])
        .map((item) => (typeof item === 'object' ? item?.name ?? relatedName(item?.id) : relatedName(item)))
        .join(' ');
    case 'selection':
      return `${field.options?.[value] ?? ''} ${value}`;
    default:
      return typeof value === 'object' ? value.name ?? '' : String(value);
  }
};

/** Records matching every facet (AND), each facet matching any of its values (OR); case-insensitive. */
export const filterRecords = (data, facets, fields, names = {}) => {
  if (facets.length === 0) return data;
  const byName = Object.fromEntries(fields.map((f) => [f.name, f]));
  return data.filter((row) =>
    facets.every((facet) => {
      const text = textOf(byName[facet.field] || { name: facet.field, type: 'text' }, row, names).toLowerCase();
      return facet.values.some((value) => text.includes(value.toLowerCase()));
    })
  );
};

/**
 * useFacetSearch
 *
 * Odoo-style search for any list or Kanban view. The searchable fields come from the model
 * registry (ir_model_field); a field is offered when the view's records actually carry it.
 * Lists without a registered model fall back to their visible columns.
 *
 * Facets: [{ field, label, values: [...] }]. Records must match every facet (AND) and, within a
 * facet, any of its values (OR). Facets are kept per view for the browser session and shared
 * between the List and Kanban of the same view.
 */
export default function useFacetSearch({ config, data = [], onFacetsChange }) {
  const storageKey = storageKeyOf(config);
  const model = registryModelOf(config);
  const [registryFields, setRegistryFields] = useState(null);
  const [facets, setFacetsState] = useState(() => readFacets(storageKey));
  const [names, setNames] = useState({}); // relation -> Map<id, name>

  useEffect(() => {
    let isMounted = true;
    if (!model) {
      setRegistryFields([]);
      return undefined;
    }
    searchService.fields(model).then(
      (fields) => isMounted && setRegistryFields(fields),
      () => isMounted && setRegistryFields([])
    );
    return () => {
      isMounted = false;
    };
  }, [model]);

  const fields = useMemo(() => {
    const keys = new Set(data.slice(0, 50).flatMap((row) => Object.keys(row)));
    const fromRegistry = (registryFields || [])
      .filter((f) => SEARCHABLE_TYPES.has(f.field_type) && !f.primary_key && !HIDDEN_FIELDS.test(f.name) && keys.has(f.name))
      .map((f) => ({ name: f.name, label: f.label, type: f.field_type, relation: f.relation, options: selectionLabels(f) }));
    const list = fromRegistry.length > 0
      ? fromRegistry
      : (config.columns || [])
          .filter((col) => col.field && col.field !== 'actions' && col.visible !== false)
          .map((col) => ({ name: col.field, label: col.headerName || col.field, type: 'text' }));
    const rank = (field) => (FIRST_FIELDS.includes(field.name) ? FIRST_FIELDS.indexOf(field.name) : FIRST_FIELDS.length);
    return [...list].sort((a, b) => rank(a) - rank(b));
  }, [registryFields, data, config.columns]);

  // Names of related records, fetched only for relational fields that are being searched.
  useEffect(() => {
    let isMounted = true;
    const wanted = fields.filter((f) => f.relation && facets.some((facet) => facet.field === f.name));
    wanted.forEach((field) => {
      const ids = data.flatMap((row) => {
        const value = row[field.name];
        return Array.isArray(value) ? value.map((item) => (typeof item === 'object' ? item?.id : item)) : [value];
      });
      searchService.names(field.relation, ids).then(
        (map) => isMounted && setNames((current) => ({ ...current, [field.relation]: map })),
        () => {}
      );
    });
    return () => {
      isMounted = false;
    };
  }, [fields, facets, data]);

  const setFacets = useCallback((next) => {
    setFacetsState(next);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // storage unavailable: the search simply is not remembered
    }
    onFacetsChange?.(next);
  }, [storageKey, onFacetsChange]);

  const addFacet = useCallback((field, value) => {
    const existing = facets.find((facet) => facet.field === field.name);
    if (existing?.values.some((v) => v.toLowerCase() === value.toLowerCase())) return;
    setFacets(existing
      ? facets.map((facet) => (facet === existing ? { ...facet, values: [...facet.values, value] } : facet))
      : [...facets, { field: field.name, label: field.label, values: [value] }]);
  }, [facets, setFacets]);

  const removeFacet = useCallback((index) => setFacets(facets.filter((_, i) => i !== index)), [facets, setFacets]);

  const filteredData = useMemo(() => filterRecords(data, facets, fields, names), [data, facets, fields, names]);

  return { filteredData, searchProps: { fields, facets, onAdd: addFacet, onRemove: removeFacet } };
}
