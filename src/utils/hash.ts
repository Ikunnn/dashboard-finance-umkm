// Pure JS SHA-256 hex — sync, works in browser & node without deps
export async function sha256Hex(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Salted password hash — email lower as salt (mitigasi rainbow table)
// Format: sha256(email:password)
export async function hashPassword(email: string, password: string): Promise<string> {
  return sha256Hex(email.trim().toLowerCase() + ':' + password);
}

// Sync fallback for initialData seeding (not crypto-strong, but deterministic)
// Used only if you need sync hash outside browser; actual login uses sha256Hex above
export function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h).toString(36).padStart(8, '0');
}
