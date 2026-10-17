/** Só os dígitos do telefone. */
function digits(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** Link para ligar ("tel:"), ou null se não houver telefone. */
export function telLink(phone: string): string | null {
  const number = digits(phone);
  return number.length >= 8 ? `tel:${number}` : null;
}

/**
 * Link do WhatsApp. Números brasileiros sem código do país (10 ou 11 dígitos, com DDD)
 * ganham o 55 na frente.
 */
export function whatsappLink(phone: string): string | null {
  let number = digits(phone);
  if (number.length < 10) return null;
  if (number.length <= 11) number = `55${number}`;
  return `https://wa.me/${number}`;
}
