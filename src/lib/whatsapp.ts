/**
 * Costruisce un link wa.me da un numero (qualsiasi formato: tiene solo le
 * cifre). Torna null se il numero manca, così il chiamante può nascondere la
 * CTA senza rompere nulla.
 */
export function whatsappLink(number?: string, message?: string): string | null {
  if (!number) return null;
  const digits = number.replace(/\D/g, '');
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
