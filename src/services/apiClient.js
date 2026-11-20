import { API_BASE_URL, API_TIMEOUT } from '../config/apiConfig';

export const ACCESS_TOKEN_STORAGE_KEY = 'exobook_access_token';
export const UNAUTHORIZED_EVENT = 'exobook:unauthorized';

/**
 * Normalizes FastAPI and backend error responses into a clean structured format:
 * {
 *   message: string,
 *   fieldErrors: { [fieldName]: string },
 *   status: number,
 *   raw: any
 * }
 */
export function normalizeApiError(error, responseBody) {
  const result = {
    message: 'An unexpected error occurred. Please check your connection.',
    fieldErrors: {},
    status: error?.status || 500,
    raw: responseBody,
  };

  if (!responseBody) {
    if (error?.message) {
      result.message = error.message;
    }
    return result;
  }

  // 1. FastAPI Standard RequestValidationError: { detail: [{ loc: ["body", "field_name"], msg: "..." }] }
  if (Array.isArray(responseBody.detail)) {
    result.message = 'Please correct the validation errors below.';
    responseBody.detail.forEach((item) => {
      // Find the field name in loc array (e.g. ["body", "tax_number"] -> "tax_number")
      const loc = item.loc || [];
      const field = loc.filter((part) => part !== 'body' && part !== 'query' && part !== 'path').pop();
      if (field) {
        result.fieldErrors[field] = item.msg || 'Invalid field value';
      }
    });
    return result;
  }

  // 2. Custom ExoBook backend errors: { message: "Validation failed.", errors: [{ field: "name", message: "..." }] }
  if (Array.isArray(responseBody.errors)) {
    result.message = responseBody.message || 'Validation failed.';
    responseBody.errors.forEach((err) => {
      if (err.field) {
        result.fieldErrors[err.field] = err.message || 'Invalid value';
      }
    });
    return result;
  }

  // 3. Simple message string in detail or message
  if (typeof responseBody.detail === 'string') {
    result.message = responseBody.detail;
  } else if (typeof responseBody.message === 'string') {
    result.message = responseBody.message;
  }

  return result;
}

/**
 * Centralized HTTP API client using native fetch.
 * Handles base URL, headers, timeouts, JSON parsing, and unified error handling.
 */
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  getBaseUrl() {
    return this.baseUrl || API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.getBaseUrl()}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const activeCompanyId = typeof window !== 'undefined' ? localStorage.getItem('exobook_active_company_id') : null;
    // The access token is only ever sent to the ExoBook backend, never to absolute third-party URLs.
    const isBackendCall = !endpoint.startsWith('http');
    const accessToken =
      isBackendCall && typeof window !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) : null;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(activeCompanyId ? { 'X-Company-Id': activeCompanyId } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || API_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? { rawText: text } : {};
      }

      if (response.status === 401 && accessToken && typeof window !== 'undefined') {
        // Session expired or revoked: let AuthContext sign the user out.
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
      }

      if (!response.ok) {
        const normalized = normalizeApiError({ status: response.status }, data);
        const err = new Error(normalized.message);
        err.status = response.status;
        err.fieldErrors = normalized.fieldErrors;
        err.raw = data;
        throw err;
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);

      // Handle fetch timeout / network errors
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Request timed out after ${API_TIMEOUT / 1000}s. Backend server may be offline.`);
        timeoutErr.status = 408;
        timeoutErr.fieldErrors = {};
        throw timeoutErr;
      }

      if (!err.status) {
        // Network failure (CORS blocked, server unreachable, etc.)
        const networkErr = new Error(
          `Unable to connect to FastAPI backend at ${this.getBaseUrl()}. Please ensure the server is running and CORS is permitted.`
        );
        networkErr.status = 0;
        networkErr.fieldErrors = {};
        networkErr.isNetworkError = true;
        throw networkErr;
      }

      throw err;
    }
  }

  get(endpoint, options = {}) {
    let url = endpoint;
    if (options.params) {
      const query = new URLSearchParams(options.params).toString();
      if (query) {
        url += (url.includes('?') ? '&' : '?') + query;
      }
    }
    return this.request(url, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;

