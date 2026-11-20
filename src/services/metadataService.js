import apiClient from './apiClient';
import { MODEL_METADATA } from '../config/modelMetadata';

/**
 * Metadata Service
 * Fetches schema metadata for any FastAPI model dynamically.
 * Attempts GET /metadata/{modelName} on FastAPI first.
 * If backend endpoint is unavailable or returns 404, gracefully falls back
 * to the MODEL_METADATA registry.
 */
class MetadataService {
  constructor() {
    this.cache = new Map();
  }

  async getModelMetadata(modelName) {
    const key = modelName?.toLowerCase();
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    try {
      const response = await apiClient.get(`/metadata/${key}`);
      if (response && Array.isArray(response.fields) && response.fields.length > 0) {
        this.cache.set(key, response);
        return response;
      }
    } catch {
      // Backend /metadata/{model} not reachable or not implemented yet; fallback to modelMetadata config
    }

    const lowerKey = key?.toLowerCase();
    const foundKey = Object.keys(MODEL_METADATA).find(
      (k) => k.toLowerCase() === lowerKey || MODEL_METADATA[k]?.model?.toLowerCase() === lowerKey
    );
    const fallback = (foundKey ? MODEL_METADATA[foundKey] : null) || {
      model: key,
      fields: [],
    };
    this.cache.set(key, fallback);
    return fallback;
  }
}

export const metadataService = new MetadataService();
export default metadataService;

