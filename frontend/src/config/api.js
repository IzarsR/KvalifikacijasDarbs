const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');

const API_PREFIX = `${API_BASE_URL}/api`;

export const AUTH_API_URL = `${API_PREFIX}/auth`;
export const CONTACT_API_URL = `${API_PREFIX}/contact`;
export const VIDEOS_API_URL = `${API_PREFIX}/videos`;

export function withApiBaseUrl(value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (!value.startsWith('/')) return value;
  return `${API_BASE_URL}${value}`;
}