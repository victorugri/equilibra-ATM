/** Mensagens em linguagem simples para os erros de conta do Supabase. */
const MESSAGES: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  user_already_exists: 'Já existe uma conta com este e-mail. Tente entrar.',
  email_exists: 'Já existe uma conta com este e-mail. Tente entrar.',
  weak_password: 'A senha precisa ter pelo menos 8 caracteres.',
  email_not_confirmed: 'Confirme seu e-mail pelo link que enviamos antes de entrar.',
  email_address_invalid: 'Confira o e-mail digitado.',
  validation_failed: 'Confira o e-mail e a senha digitados.',
  over_email_send_rate_limit: 'Muitas tentativas. Espere alguns minutos e tente de novo.',
  over_request_rate_limit: 'Muitas tentativas. Espere alguns minutos e tente de novo.',
  same_password: 'A nova senha precisa ser diferente da anterior.',
  session_not_found: 'Sua sessão expirou. Entre de novo.',
};

export const OFFLINE_MESSAGE = 'Sem conexão com a internet. Tente de novo quando estiver on-line.';
const GENERIC_MESSAGE = 'Não foi possível concluir agora. Tente de novo em instantes.';

export function authErrorMessage(error: unknown): string {
  if (globalThis.navigator && !navigator.onLine) return OFFLINE_MESSAGE;
  const code = (error as { code?: string } | null)?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  const name = (error as { name?: string } | null)?.name;
  if (name === 'AuthRetryableFetchError' || name === 'TypeError') return OFFLINE_MESSAGE;
  return GENERIC_MESSAGE;
}
