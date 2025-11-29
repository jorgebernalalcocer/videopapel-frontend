// Read base URL from either NEXT_PUBLIC_API_BASE_URL (preferred) or legacy NEXT_PUBLIC_API_BASE
const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE;

if (!rawBase) {
  throw new Error('Missing NEXT_PUBLIC_API_BASE_URL (or NEXT_PUBLIC_API_BASE) environment variable');
}

// Normalize so we never end with a trailing slash
export const API_BASE = rawBase.replace(/\/+$/, '');

// Normalize prefix so it always starts with a single slash and has no trailing slash
const rawPrefix = process.env.NEXT_PUBLIC_API_PREFIX ?? '/api/v1';
export const API_PREFIX = rawPrefix ? `/${rawPrefix.replace(/^\/+/, '').replace(/\/+$/, '')}` : '';

export const API_URL = `${API_BASE}${API_PREFIX}`;
