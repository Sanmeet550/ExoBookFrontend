import apiClient from './apiClient';

/**
 * Relation Cache Service
 * 
 * Central cache for relational dropdown lookups to avoid duplicate API requests.
 * Loads records once from endpoints (e.g., /country/view/all, /currency/view/all, /uom/view/all)
 * and provides instant synchronous or cached asynchronous access.
 */
class RelationCacheService {
  constructor() {
    this.cache = new Map();
    this.inFlight = new Map();
  }

  async getRelationRecords(endpoint) {
    if (!endpoint) return [];

    if (this.cache.has(endpoint)) {
      return this.cache.get(endpoint);
    }

    if (this.inFlight.has(endpoint)) {
      return this.inFlight.get(endpoint);
    }

    const requestPromise = apiClient
      .get(endpoint)
      .then((data) => {
        const records = Array.isArray(data) ? data : [];
        this.cache.set(endpoint, records);
        this.inFlight.delete(endpoint);
        return records;
      })
      .catch((err) => {
        this.inFlight.delete(endpoint);
        console.warn(`Failed to fetch relational data from ${endpoint}:`, err);
        return [];
      });

    this.inFlight.set(endpoint, requestPromise);
    return requestPromise;
  }

  clear(endpoint = null) {
    if (endpoint) {
      this.cache.delete(endpoint);
    } else {
      this.cache.clear();
    }
  }
}

export const relationCacheService = new RelationCacheService();
export default relationCacheService;

