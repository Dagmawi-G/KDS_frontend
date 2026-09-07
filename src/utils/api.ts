/**
 * Centralized API URL resolver for local development and deployed production environments.
 * Uses VITE_API_URL or VITE_BACKEND_URL from environment variables if defined.
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '').trim();

/**
 * Returns the full API URL for a given endpoint path.
 * In local dev (empty base): returns relative path e.g. '/api/auth/staff'
 * In production: returns e.g. 'https://kds-backend.onrender.com/api/auth/staff'
 */
export const apiUrl = (endpoint: string): string => {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${path}` : path;
};
