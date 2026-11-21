/**
 * End-to-End (E2E) shifrlash moduli — Web Crypto API asosida.
 *
 * Tamoyil:
 *  - Har bir foydalanuvchi qurilmasida ECDH (P-256) kalit juftligi yaratiladi.
 *  - MAXFIY kalit hech qachon serverga yuborilmaydi (faqat localStorage'da).
 *  - OCHIQ kalit serverga e'lon qilinadi (User.public_key).
 *  - Ikki foydalanuvchi ochiq kalitlaridan ECDH orqali umumiy AES-GCM
 *    kalit hosil qilinadi. Shu kalit bilan matn shifrlanadi/deshifrlanadi.
 *  - Server faqat shifrlangan matnni ("enc:v1:...") ko'radi va o'qiy olmaydi.
 *
 * WebRTC qo'ng'iroqlar (audio/video) esa brauzerning o'zida DTLS-SRTP bilan
 * shifrlanadi — media oqim server orqali o'tmaydi (peer-to-peer).
 */

const ENC_PREFIX = 'enc:v1:';
const PRIV_KEY_STORAGE = (userId: number) => `e2e_priv_${userId}`;

interface StoredJwk {
  privateKey: JsonWebKey;
  publicKey: JsonWebKey;
}

let cachedKeyPair: CryptoKeyPair | null = null;
let cachedKeyPairUserId: number | null = null;
const sharedKeyCache = new Map<string, CryptoKey>();

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function b64ToBuf(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function isCryptoAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.crypto !== 'undefined' &&
    typeof window.crypto.subtle !== 'undefined'
  );
}

/**
 * Foydalanuvchi uchun ECDH kalit juftligini oladi yoki yaratadi.
 * Maxfiy kalit faqat shu qurilmada (localStorage) saqlanadi.
 */
export async function getOrCreateKeyPair(
  userId: number
): Promise<{ keyPair: CryptoKeyPair; publicJwk: JsonWebKey } | null> {
  if (!isCryptoAvailable()) return null;

  if (cachedKeyPair && cachedKeyPairUserId === userId) {
    const publicJwk = await crypto.subtle.exportKey('jwk', cachedKeyPair.publicKey);
    return { keyPair: cachedKeyPair, publicJwk };
  }

  const storageKey = PRIV_KEY_STORAGE(userId);
  const stored = localStorage.getItem(storageKey);

  let keyPair: CryptoKeyPair;

  if (stored) {
    try {
      const parsed = JSON.parse(stored) as StoredJwk;
      const publicKey = await crypto.subtle.importKey(
        'jwk', parsed.publicKey,
        { name: 'ECDH', namedCurve: 'P-256' }, true, []
      );
      const privateKey = await crypto.subtle.importKey(
        'jwk', parsed.privateKey,
        { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']
      );
      keyPair = { publicKey, privateKey };
    } catch {
      localStorage.removeItem(storageKey);
      keyPair = await generateKeyPair();
    }
  } else {
    keyPair = await generateKeyPair();
  }

  const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
  localStorage.setItem(storageKey, JSON.stringify({ privateKey: privateJwk, publicKey: publicJwk }));

  cachedKeyPair = keyPair;
  cachedKeyPairUserId = userId;
  return { keyPair, publicJwk };
}

async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true, // extractable=true (faqat maxfiy kalitni qurilmada saqlash uchun)
    ['deriveKey']
  ) as Promise<CryptoKeyPair>;
}

/**
 * Hamkor (peer) ochiq kalitidan umumiy AES-GCM kalit hosil qiladi.
 * Natija peerId bo'yicha keshlanadi.
 */
export async function deriveSharedKey(
  myKeyPair: CryptoKeyPair,
  peerPublicJwk: JsonWebKey,
  peerId: number,
  keyVersion = ''
): Promise<CryptoKey | null> {
  const cacheKey = `${peerId}:${keyVersion}`;
  const cached = sharedKeyCache.get(cacheKey);
  if (cached) return cached;

  try {
    const peerKey = await crypto.subtle.importKey(
      'jwk', peerPublicJwk,
      { name: 'ECDH', namedCurve: 'P-256' }, false, []
    );
    const sharedKey = await crypto.subtle.deriveKey(
      { name: 'ECDH', public: peerKey },
      myKeyPair.privateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    sharedKeyCache.set(cacheKey, sharedKey);
    return sharedKey;
  } catch {
    return null;
  }
}

export function clearSharedKey(peerId: number): void {
  for (const k of Array.from(sharedKeyCache.keys())) {
    if (k.startsWith(`${peerId}:`)) sharedKeyCache.delete(k);
  }
}

/** Matnni AES-GCM bilan shifrlaydi. Natija: "enc:v1:<iv>:<ciphertext>" */
export async function encryptText(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return `${ENC_PREFIX}${bufToB64(iv.buffer)}:${bufToB64(cipher)}`;
}

/** Shifrlangan matnni deshifrlaydi. Agar matn shifrlanmagan bo'lsa — o'zini qaytaradi. */
export async function decryptText(payload: string, key: CryptoKey | null): Promise<string> {
  if (!payload || !payload.startsWith(ENC_PREFIX)) return payload;
  if (!key) return '🔒 [Shifrlangan xabar — kalit mavjud emas]';

  try {
    const rest = payload.slice(ENC_PREFIX.length);
    const sep = rest.indexOf(':');
    const iv = b64ToBuf(rest.slice(0, sep));
    const cipher = b64ToBuf(rest.slice(sep + 1));
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipher
    );
    return new TextDecoder().decode(plain);
  } catch {
    return '🔒 [Shifrlangan xabar — deshifrlab bo\'lmadi]';
  }
}

export function isEncrypted(payload: string | null | undefined): boolean {
  return !!payload && payload.startsWith(ENC_PREFIX);
}
