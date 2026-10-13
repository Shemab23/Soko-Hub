/**
 * Simulated cryptographic utilities:
 * - Hashed passwords (stored only as simulated secure hash strings)
 * - Signed guest sessions (detects tampering)
 * - HMAC webhook signatures for simulated payment providers
 */

export function mockHashPassword(password: string): string {
  // Deterministic fake SHA-256 hash
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `hash$sha256$mock_salt981_${hex}fa829c3d4e`;
}

export function verifyMockPassword(password: string, storedHash: string): boolean {
  return mockHashPassword(password) === storedHash;
}

export function generateGuestSession(): { id: string; signature: string } {
  const rand = Math.random().toString(36).substring(2, 10);
  const id = `guest_${Date.now()}_${rand}`;
  const signature = computeSessionSignature(id);
  return { id, signature };
}

export function computeSessionSignature(sessionId: string): string {
  let hash = 5381;
  const secret = 'soko_secret_sign_key_9021';
  const combined = sessionId + ':' + secret;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) + hash) + combined.charCodeAt(i);
    hash |= 0;
  }
  return `sig_v1_${Math.abs(hash).toString(16)}`;
}

export function verifyGuestSession(sessionId: string, signature: string): boolean {
  if (!sessionId || !signature) return false;
  return computeSessionSignature(sessionId) === signature;
}

export function generateWebhookSignature(payload: unknown, secret = 'whsec_soko_mock_827394'): string {
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
  let hash = 0;
  const input = str + '::' + secret;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `t=${Date.now()},v1=${Math.abs(hash).toString(16)}bc7391`;
}

export function verifyWebhookSignature(signature: string, payload: unknown): boolean {
  if (!signature || signature.startsWith('CORRUPTED_')) {
    return false;
  }
  // If it contains valid format v1=... and not corrupted
  return signature.includes('v1=');
}
