import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── In-flight request deduplication cache ───────────────
// Prevents the same GET endpoint from being called multiple times simultaneously
const inflightRequests = new Map<string, Promise<any>>();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      const message = error.response.data?.error || 'Too many requests. Please slow down.';
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  }
);

/**
 * Deduplicated GET — prevents the same endpoint from being called
 * multiple times in parallel (e.g. from React effects re-running).
 * Uses an in-flight cache keyed by URL + params.
 */
export function deduplicatedGet<T = any>(url: string, params?: any): Promise<T> {
  const cacheKey = `${url}::${JSON.stringify(params || {})}`;

  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey)!;
  }

  const promise = api.get(url, { params })
    .then(res => res.data)
    .finally(() => {
      inflightRequests.delete(cacheKey);
    });

  inflightRequests.set(cacheKey, promise);
  return promise;
}

/**
 * Returns the server root URL (no /api suffix).
 * e.g. VITE_API_URL = "http://localhost:5000/api" → "http://localhost:5000"
 */
export function getServerRoot(): string {
  const base = API_BASE_URL;
  return base.replace(/\/api(\/v\d+)?$/, '');
}

export default api;
