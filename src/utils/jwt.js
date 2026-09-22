/**
 * Safe, RFC-compliant JWT decoder and role normalizer for the Gearly ecosystem.
 * Handles unpadded base64url strings, UTF-8 character encoding, quotes, and role casing variations.
 * Guaranteed never to throw uncaught InvalidCharacterError.
 */

export function sanitizeToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return '';
  let clean = rawToken.trim();
  
  // Recursively strip outer quotes that may be introduced during JSON transfer or localStorage
  while (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    clean = clean.slice(1, -1).trim();
  }
  return clean;
}

export function decodeJwt(token) {
  let clean = sanitizeToken(token);
  if (!clean) return null;

  try {
    // Strip "Bearer " prefix if present
    if (clean.toLowerCase().startsWith('bearer ')) {
      clean = clean.slice(7).trim();
    }

    const parts = clean.split('.');
    if (parts.length < 2) return null;

    // Filter payload slice to strict base64url alphabet (strip any quotes or invalid characters)
    let base64Url = parts[1].replace(/[^A-Za-z0-9\-_]/g, '');
    if (!base64Url) return null;

    // A base64 block with remainder 1 is mathematically impossible to decode; return null safely
    if (base64Url.length % 4 === 1) {
      return null;
    }

    // Convert base64url to standard base64
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // Add required '=' padding strictly for remainder 2 or 3
    const remainder = base64.length % 4;
    if (remainder === 2) {
      base64 += '==';
    } else if (remainder === 3) {
      base64 += '=';
    }

    // Decode base64 to binary string safely
    const binaryStr = window.atob(base64);

    // Decode UTF-8 percent-encoded bytes to handle international characters properly
    const jsonPayload = decodeURIComponent(
      binaryStr
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const parsed = JSON.parse(jsonPayload);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    // Return null safely without throwing uncaught DOM exceptions
    return null;
  }
}

/**
 * Normalizes role from claims or fallback sources.
 * Returns lowercase standard: 'shopkeeper' | 'customer' | 'admin' | 'user'
 */
export function extractRole(claims, fallbackRole = null) {
  if (!claims && !fallbackRole) return 'customer';

  let rawRole =
    claims?.roles ||
    claims?.role ||
    claims?.role_name ||
    claims?.user_type ||
    fallbackRole ||
    'customer';

  if (Array.isArray(rawRole)) {
    rawRole = rawRole[0] || 'customer';
  }

  if (typeof rawRole === 'string') {
    const lower = rawRole.toLowerCase().trim();
    if (lower === 'shopkeeper' || lower === 'merchant' || lower === 'seller') {
      return 'shopkeeper';
    }
    if (lower === 'customer' || lower === 'user' || lower === 'buyer') {
      return 'customer';
    }
    return lower;
  }

  return 'customer';
}

/**
 * Checks whether a token is expired
 */
export function isTokenExpired(claims) {
  if (!claims || !claims.exp) return false;
  return Date.now() >= claims.exp * 1000;
}
