/**
 * Configuração do app. A URL e a chave publicável do Supabase são públicas por natureza
 * (vão no navegador); quem protege os dados são as regras de acesso (RLS) do banco.
 * Nunca coloque aqui a secret key / service_role nem a senha do banco.
 *
 * Para usar seu próprio projeto Supabase, troque os dois valores abaixo e aplique as
 * migrações de supabase/migrations (ver README).
 */
export const environment = {
  supabase: {
    url: 'https://qzbbdtsinhdhguwczdtv.supabase.co',
    publishableKey: 'sb_publishable_6VOrZ92ijwyWvI2FZlwhBQ_5c4eAb7_',
  },
  push: {
    /** Chave pública VAPID das notificações, gerada por "npm run push:keys" (a privada fica
     * só nos segredos do Supabase). Vazia = lembretes ainda não configurados. */
    vapidPublicKey: 'BN_U23QOJnx2xWjPguoNyHYyFQZLz2FBYaijL0nqdlFblg-R6JxXNAOK03OuqZAoW26jGDvytPLTk1I5-KYCTAE',
  },
};
