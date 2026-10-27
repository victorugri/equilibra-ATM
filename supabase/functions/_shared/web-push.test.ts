// Testes do Web Push (rodam no Node: npm run test:functions).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { reminderNotification } from './reminder-notification.ts';
import {
  base64UrlDecode,
  base64UrlEncode,
  encryptPayload,
  sendWebPush,
  vapidAuthorization,
  type VapidKeys,
} from './web-push.ts';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Um "navegador" de teste: par de chaves ECDH e segredo de autenticação. */
async function fakeBrowser() {
  const keys = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveBits',
  ]);
  const publicKey = new Uint8Array(await crypto.subtle.exportKey('raw', keys.publicKey));
  const auth = crypto.getRandomValues(new Uint8Array(16));
  return {
    keys,
    target: {
      endpoint: 'https://push.exemplo/envio/abc',
      p256dh: base64UrlEncode(publicKey),
      auth: base64UrlEncode(auth),
    },
  };
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8),
  );
}

/** Decifra como o navegador faria (RFC 8291), para conferir a ida e volta. */
async function decrypt(body: Uint8Array, browser: Awaited<ReturnType<typeof fakeBrowser>>) {
  const salt = body.slice(0, 16);
  const recordSize = new DataView(body.buffer, body.byteOffset).getUint32(16);
  const keyLength = body[20];
  const serverPublic = body.slice(21, 21 + keyLength);
  const ciphertext = body.slice(21 + keyLength);
  const serverKey = await crypto.subtle.importKey(
    'raw',
    serverPublic,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );
  const shared = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: serverKey },
      browser.keys.privateKey,
      256,
    ),
  );
  const clientPublic = base64UrlDecode(browser.target.p256dh);
  const info = new Uint8Array([
    ...encoder.encode('WebPush: info\0'),
    ...clientPublic,
    ...serverPublic,
  ]);
  const ikm = await hkdf(base64UrlDecode(browser.target.auth), shared, info, 32);
  const contentKey = await hkdf(salt, ikm, encoder.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, encoder.encode('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', contentKey, 'AES-GCM', false, ['decrypt']);
  const plain = new Uint8Array(
    await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, key, ciphertext),
  );
  assert.equal(plain.at(-1), 2, 'último registro termina com 0x02');
  return { text: decoder.decode(plain.slice(0, -1)), recordSize, keyLength };
}

async function vapidKeys(): Promise<VapidKeys> {
  const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ]);
  const jwk = await crypto.subtle.exportKey('jwk', keys.privateKey);
  const publicKey = new Uint8Array(await crypto.subtle.exportKey('raw', keys.publicKey));
  return {
    publicKey: base64UrlEncode(publicKey),
    privateKey: jwk.d!,
    subject: 'https://equilibraatm.exemplo',
  };
}

describe('web push', () => {
  it('base64url vai e volta sem perder bytes', () => {
    const bytes = crypto.getRandomValues(new Uint8Array(65));
    assert.deepEqual(base64UrlDecode(base64UrlEncode(bytes)), bytes);
    assert.doesNotMatch(base64UrlEncode(bytes), /[+/=]/);
  });

  it('o navegador consegue decifrar a mensagem (aes128gcm)', async () => {
    const browser = await fakeBrowser();
    const message = JSON.stringify({ notification: { title: 'Olá, ação, ç' } });
    const body = await encryptPayload(encoder.encode(message), browser.target);
    const result = await decrypt(body, browser);
    assert.equal(result.text, message);
    assert.equal(result.recordSize, 4096);
    assert.equal(result.keyLength, 65);
  });

  it('cada envio usa sal e chave temporária novos', async () => {
    const browser = await fakeBrowser();
    const a = await encryptPayload(encoder.encode('x'), browser.target);
    const b = await encryptPayload(encoder.encode('x'), browser.target);
    assert.notDeepEqual(a.slice(0, 86), b.slice(0, 86));
  });

  it('recusa mensagem maior que um registro', async () => {
    const browser = await fakeBrowser();
    await assert.rejects(encryptPayload(new Uint8Array(5000), browser.target));
  });

  it('assina o JWT VAPID com a chave do servidor (ES256)', async () => {
    const vapid = await vapidKeys();
    const now = Date.UTC(2026, 9, 17, 12);
    const header = await vapidAuthorization('https://fcm.googleapis.com/fcm/send/x', vapid, now);
    const [, token, key] = header.match(/^vapid t=([^,]+), k=(.+)$/)!;
    assert.equal(key, vapid.publicKey);
    const [h, c, s] = token.split('.');
    assert.deepEqual(JSON.parse(decoder.decode(base64UrlDecode(h))), { typ: 'JWT', alg: 'ES256' });
    assert.deepEqual(JSON.parse(decoder.decode(base64UrlDecode(c))), {
      aud: 'https://fcm.googleapis.com',
      exp: now / 1000 + 12 * 3600,
      sub: vapid.subject,
    });
    const publicKey = await crypto.subtle.importKey(
      'raw',
      base64UrlDecode(vapid.publicKey),
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    );
    const valid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      base64UrlDecode(s),
      encoder.encode(`${h}.${c}`),
    );
    assert.ok(valid, 'assinatura confere com a chave pública');
  });

  it('envia com os cabeçalhos do Web Push e marca aparelhos que saíram', async () => {
    const browser = await fakeBrowser();
    const vapid = await vapidKeys();
    const calls: { url: string; init: RequestInit }[] = [];
    const fakeFetch = (status: number) =>
      (async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return new Response(null, { status });
      }) as unknown as typeof fetch;

    const ok = await sendWebPush(
      browser.target,
      'oi',
      vapid,
      { topic: 'lembrete' },
      fakeFetch(201),
    );
    assert.deepEqual(ok, { ok: true, status: 201, gone: false });
    const headers = calls[0].init.headers as Record<string, string>;
    assert.equal(calls[0].url, browser.target.endpoint);
    assert.equal(headers['Content-Encoding'], 'aes128gcm');
    assert.equal(headers['TTL'], '3600');
    assert.equal(headers['Topic'], 'lembrete');
    assert.match(headers['Authorization'], /^vapid t=.+, k=.+$/);
    const sent = await decrypt(calls[0].init.body as Uint8Array, browser);
    assert.equal(sent.text, 'oi');

    const gone = await sendWebPush(browser.target, 'oi', vapid, {}, fakeFetch(410));
    assert.deepEqual(gone, { ok: false, status: 410, gone: true });
    const error = await sendWebPush(browser.target, 'oi', vapid, {}, fakeFetch(429));
    assert.equal(error.gone, false);
  });

  it('a notificação do lembrete abre o check-in daquele lembrete', () => {
    const message = reminderNotification('abc-123');
    assert.equal(message.notification.title, 'Seus dentes estão se tocando agora?');
    assert.equal(message.notification.data.onActionClick.default.url, '/lembrete?e=abc-123');
    assert.ok(JSON.stringify(message).length < 1000);
  });
});
