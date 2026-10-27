/**
 * Envio de notificações Web Push (RFC 8030): conteúdo criptografado com aes128gcm (RFC 8291)
 * e servidor identificado por VAPID (RFC 8292). Usa só WebCrypto, então roda igual no Deno
 * (Edge Function) e no Node (testes), sem bibliotecas.
 */

/** Aparelho inscrito (vem do PushSubscription do navegador). */
export interface PushTarget {
  endpoint: string;
  /** Chave pública do aparelho (P-256, base64url). */
  p256dh: string;
  /** Segredo de autenticação do aparelho (16 bytes, base64url). */
  auth: string;
}

/** Chaves VAPID do servidor, em base64url: pública (65 bytes) e privada (32 bytes). */
export interface VapidKeys {
  publicKey: string;
  privateKey: string;
  /** Contato do responsável pelo envio: "mailto:..." ou "https://...". */
  subject: string;
}

export interface PushOptions {
  /** Segundos que o serviço de push guarda a mensagem se o aparelho estiver desligado. */
  ttl?: number;
  urgency?: 'very-low' | 'low' | 'normal' | 'high';
  /** Mensagens com o mesmo tópico substituem a anterior ainda não entregue. */
  topic?: string;
}

export interface PushResult {
  ok: boolean;
  status: number;
  /** O aparelho cancelou a inscrição: pode apagar. */
  gone: boolean;
}

/** Para os testes: fixa o sal e a chave temporária da criptografia. */
export interface EncryptOverrides {
  salt?: Uint8Array<ArrayBuffer>;
  serverKeys?: CryptoKeyPair;
}

/** Tamanho de registro do aes128gcm; a mensagem inteira precisa caber num registro. */
const RECORD_SIZE = 4096;
const MAX_PAYLOAD = RECORD_SIZE - 17;

const encoder = new TextEncoder();

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(text: string): Uint8Array<ArrayBuffer> {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function concat(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

async function hkdf(
  salt: Uint8Array<ArrayBuffer>,
  ikm: Uint8Array<ArrayBuffer>,
  info: Uint8Array<ArrayBuffer>,
  length: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

/** Criptografa a mensagem para um aparelho (RFC 8291, um único registro aes128gcm). */
export async function encryptPayload(
  payload: Uint8Array<ArrayBuffer>,
  target: Pick<PushTarget, 'p256dh' | 'auth'>,
  overrides: EncryptOverrides = {},
): Promise<Uint8Array<ArrayBuffer>> {
  if (payload.length > MAX_PAYLOAD) throw new Error('Mensagem grande demais para o Web Push.');
  const clientPublic = base64UrlDecode(target.p256dh);
  const authSecret = base64UrlDecode(target.auth);

  const serverKeys =
    overrides.serverKeys ??
    ((await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
      'deriveBits',
    ])) as CryptoKeyPair);
  const serverPublic = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeys.publicKey));
  const clientKey = await crypto.subtle.importKey(
    'raw',
    clientPublic,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );
  const shared = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: clientKey }, serverKeys.privateKey, 256),
  );

  const ikm = await hkdf(
    authSecret,
    shared,
    concat(encoder.encode('WebPush: info\0'), clientPublic, serverPublic),
    32,
  );
  const salt = overrides.salt ?? crypto.getRandomValues(new Uint8Array(16));
  const contentKey = await hkdf(salt, ikm, encoder.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, encoder.encode('Content-Encoding: nonce\0'), 12);

  const key = await crypto.subtle.importKey('raw', contentKey, 'AES-GCM', false, ['encrypt']);
  // 0x02 marca o último (e único) registro.
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      key,
      concat(payload, new Uint8Array([2])),
    ),
  );

  const header = new Uint8Array(21);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, RECORD_SIZE);
  header[20] = serverPublic.length;
  return concat(header, serverPublic, ciphertext);
}

/** Cabeçalho Authorization com o JWT VAPID (válido por 12 horas). */
export async function vapidAuthorization(
  endpoint: string,
  vapid: VapidKeys,
  now = Date.now(),
): Promise<string> {
  const publicKey = base64UrlDecode(vapid.publicKey);
  const signingKey = await crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      d: vapid.privateKey,
      x: base64UrlEncode(publicKey.slice(1, 33)),
      y: base64UrlEncode(publicKey.slice(33, 65)),
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const json = (value: object) => base64UrlEncode(encoder.encode(JSON.stringify(value)));
  const unsigned = `${json({ typ: 'JWT', alg: 'ES256' })}.${json({
    aud: new URL(endpoint).origin,
    exp: Math.floor(now / 1000) + 12 * 60 * 60,
    sub: vapid.subject,
  })}`;
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      signingKey,
      encoder.encode(unsigned),
    ),
  );
  return `vapid t=${unsigned}.${base64UrlEncode(signature)}, k=${vapid.publicKey}`;
}

/** Envia uma mensagem (texto, em geral JSON) para um aparelho. */
export async function sendWebPush(
  target: PushTarget,
  payload: string,
  vapid: VapidKeys,
  options: PushOptions = {},
  fetchFn: typeof fetch = fetch,
): Promise<PushResult> {
  const headers: Record<string, string> = {
    Authorization: await vapidAuthorization(target.endpoint, vapid),
    'Content-Encoding': 'aes128gcm',
    'Content-Type': 'application/octet-stream',
    TTL: String(options.ttl ?? 3600),
    Urgency: options.urgency ?? 'normal',
  };
  if (options.topic) headers['Topic'] = options.topic;
  const response = await fetchFn(target.endpoint, {
    method: 'POST',
    headers,
    body: await encryptPayload(encoder.encode(payload), target),
  });
  await response.body?.cancel();
  return {
    ok: response.ok,
    status: response.status,
    gone: response.status === 404 || response.status === 410,
  };
}
