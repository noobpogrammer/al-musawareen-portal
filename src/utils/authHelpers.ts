/**
 * Authentication Helpers for Al Musawareen Portal (Vite SPA)
 */

/**
 * Returns the normalized application base URL.
 * Uses VITE_APP_URL if defined; otherwise falls back to window.location.origin.
 */
export function getAppBaseUrl(): string {
  const envUrl = import.meta.env.VITE_APP_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
}

/**
 * Cleans auth-related query parameters and hash fragments from the current URL
 * without triggering a full page reload.
 */
export function cleanAuthUrlParams(): void {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;

  const url = new URL(window.location.href);
  let modified = false;

  const authParams = [
    'auth',
    'code',
    'error',
    'error_description',
    'error_code',
    'access_token',
    'refresh_token',
    'expires_in',
    'token_type',
    'type'
  ];

  authParams.forEach(param => {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      modified = true;
    }
  });

  if (url.hash && (url.hash.includes('access_token') || url.hash.includes('type=') || url.hash.includes('error='))) {
    url.hash = '';
    modified = true;
  }

  if (modified) {
    const cleanSearch = url.searchParams.toString();
    const newPath = url.pathname + (cleanSearch ? `?${cleanSearch}` : '') + (url.hash || '');
    window.history.replaceState({}, document.title, newPath);
  }
}

/**
 * Parses auth indicator from URL search query or hash fragment.
 * Supports password recovery and email verification callback flows.
 */
export function detectAuthActionFromUrl(): 'recovery' | 'verified' | null {
  if (typeof window === 'undefined') return null;

  const urlParams = new URLSearchParams(window.location.search);
  const authQuery = urlParams.get('auth');

  if (authQuery === 'recovery') return 'recovery';
  if (authQuery === 'verified') return 'verified';

  const hash = window.location.hash || '';
  if (hash.includes('type=recovery')) return 'recovery';
  if (hash.includes('type=signup')) return 'verified';

  return null;
}
