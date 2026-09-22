/**
 * Safe, RFC-compliant JWT decoder and role normalizer for the Gearly ecosystem.
 * Handles unpadded base64url strings, UTF-8 character encoding, and role casing variations.
 */

export function sanitizeToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return '';
  // Strip surrounding quotes or whitespace that may be introduced during JSON transfer or localStorage
  return rawToken.replace(/^["']|["']$/g, '').trim();
}

export function decodeJwt(token) {
  const clean = sanitizeToken(token);
  if (!clean) return null;

  try {
    const parts = clean.split('.');
    if (parts.length < 2) return null;

    let base64Url = parts[1];
    // Convert base64url to base64
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // Add necessary base64 '=' padding if missing
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }

    // Decode base64 to binary string
    const binaryStr = window.atob(base64);

    // Decode UTF-8 percent-encoded bytes to handle special characters properly
    const jsonPayload = decodeURIComponent(
      binaryStr
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const parsed = JSON.parse(jsonPayload);
    return parsed;
  } catch (err) {
    console.error('Failed to parse JWT payload:', err);
    return null;
  }
}

/**
 * Normalizes role from claims or fallback sources.
 * Returns lowercase standard: 'shopkeeper' | 'customer' | 'admin' | 'user'
 */
export function extractRole(claims, fallbackRole = null) {
  if (!claims && !fallbackRole) return 'customer';

  // Check possible role fields in token
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
