// Gera as chaves VAPID das notificações (Web Push) e configura o projeto:
// - a chave privada vai direto para os segredos das Edge Functions do Supabase, sem aparecer
//   na tela nem ficar em arquivo do projeto;
// - a chave pública vai para src/environments/environment.ts (ela é pública por natureza).
//
// Uso: npm run push:keys            (precisa de "npx supabase login" e "link" antes)
//      npm run push:keys -- --force (gera chaves novas: os aparelhos inscritos param de
//                                    receber até abrirem o app de novo)

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ENVIRONMENT = resolve(ROOT, 'src/environments/environment.ts');
const CONFIG = resolve(ROOT, 'supabase/config.toml');
const KEY_LINE = /vapidPublicKey: '([^']*)'/;

const environment = readFileSync(ENVIRONMENT, 'utf8');
const current = environment.match(KEY_LINE);
if (!current) fail(`Não achei "vapidPublicKey" em ${ENVIRONMENT}.`);
if (current[1] && !process.argv.includes('--force')) {
  console.log('As chaves já existem (vapidPublicKey preenchida). Nada foi alterado.');
  console.log('Para gerar novas: npm run push:keys -- --force');
  process.exit(0);
}

// Contato do responsável pelo envio: o endereço do app (site_url do Supabase).
const subject = readFileSync(CONFIG, 'utf8').match(/^site_url = "(https:\/\/[^"]+)"/m)?.[1];
if (!subject) fail(`Não achei um site_url https em ${CONFIG}.`);

const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
  'sign',
  'verify',
]);
const publicKey = Buffer.from(await crypto.subtle.exportKey('raw', keys.publicKey)).toString(
  'base64url',
);
const privateKey = (await crypto.subtle.exportKey('jwk', keys.privateKey)).d;

const dir = mkdtempSync(join(tmpdir(), 'equilibra-vapid-'));
const envFile = join(dir, 'vapid.env');
try {
  writeFileSync(
    envFile,
    `VAPID_PUBLIC_KEY=${publicKey}\nVAPID_PRIVATE_KEY=${privateKey}\nVAPID_SUBJECT=${subject}\n`,
    { mode: 0o600 },
  );
  console.log('Gravando as chaves nos segredos das Edge Functions do Supabase…');
  execFileSync('npx', ['supabase', 'secrets', 'set', '--env-file', envFile], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}

writeFileSync(ENVIRONMENT, environment.replace(KEY_LINE, `vapidPublicKey: '${publicKey}'`));
console.log('✔ Chave privada guardada no Supabase (não fica em nenhum arquivo).');
console.log('✔ Chave pública gravada em src/environments/environment.ts.');
console.log('Próximo passo: npm run functions:deploy');

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}
