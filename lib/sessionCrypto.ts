/**
 * Cryptographic session signing and verification utilities using Web Crypto API.
 * Compatible with Node.js, Next.js Server Components, Route Handlers, and Edge Middleware.
 */

export interface SessionPayload {
  email: string;
  role: 'admin';
  exp: number;
}

function getSessionSecret(): string {
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ADMIN_PASSWORD;

  if (!secret) {
    throw new Error(
      'Security error: Neither ADMIN_SESSION_SECRET, SUPABASE_SERVICE_ROLE_KEY, nor ADMIN_PASSWORD is set in environment.'
    );
  }
  return secret;
}

function toBase64Url(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64url');
  }
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(b64url: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64url, 'base64url').toString('utf-8');
  }
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return decodeURIComponent(escape(atob(b64)));
}

async function computeHmacSha256(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Signs a session payload with HMAC-SHA256.
 * Format: `${base64url(payload)}.${hmacHex}`
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const secret = getSessionSecret();
  const jsonStr = JSON.stringify(payload);
  const b64 = toBase64Url(jsonStr);
  const sig = await computeHmacSha256(b64, secret);
  return `${b64}.${sig}`;
}

/**
 * Verifies that a session token is untampered, properly signed, and not expired.
 * Uses timing-safe string comparison.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [b64, providedSig] = token.split('.');
  if (!b64 || !providedSig) return null;

  try {
    const secret = getSessionSecret();
    const expectedSig = await computeHmacSha256(b64, secret);

    // Timing-safe constant-time comparison
    if (expectedSig.length !== providedSig.length) return null;
    let diff = 0;
    for (let i = 0; i < expectedSig.length; i++) {
      diff |= expectedSig.charCodeAt(i) ^ providedSig.charCodeAt(i);
    }
    if (diff !== 0) return null;

    const raw = fromBase64Url(b64);
    const parsed: SessionPayload = JSON.parse(raw);

    if (!parsed || !parsed.email || typeof parsed.exp !== 'number') {
      return null;
    }

    if (parsed.exp <= Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
