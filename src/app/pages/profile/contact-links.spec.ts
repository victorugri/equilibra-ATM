import { telLink, whatsappLink } from './contact-links';

describe('links de contato do dentista', () => {
  it('liga para o número só com dígitos', () => {
    expect(telLink('(12) 3456-7890')).toBe('tel:1234567890');
    expect(telLink('123')).toBeNull();
  });

  it('põe o 55 em números brasileiros com DDD', () => {
    expect(whatsappLink('(12) 99876-5432')).toBe('https://wa.me/5512998765432');
    expect(whatsappLink('+55 12 99876-5432')).toBe('https://wa.me/5512998765432');
    expect(whatsappLink('9876-5432')).toBeNull();
  });
});
