import { PRECIO_MAXIMO_CENTAVOS } from './config';

/**
 * Todo el dinero se maneja en centavos (números enteros) para evitar
 * errores de redondeo: $28.50 se guarda como 2850.
 */

/** Convierte centavos a texto con formato mexicano: 123450 -> "$1,234.50". */
export function formatoDinero(centavos: number): string {
  const signo = centavos < 0 ? '-' : '';
  const abs = Math.abs(Math.round(centavos));
  const pesos = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const cent = (abs % 100).toString().padStart(2, '0');
  return `${signo}$${pesos}.${cent}`;
}

/** Centavos al texto que se pone en un campo editable: 2850 -> "28.50". */
export function centavosAEntrada(centavos: number | null | undefined): string {
  if (centavos == null) return '';
  return (centavos / 100).toFixed(2);
}

/**
 * Lee lo que el usuario escribió y lo convierte a centavos.
 * Acepta "28", "28.5", "28,50", "$1,234.50". Regresa null si no es un precio válido.
 */
export function leerPrecio(texto: string): number | null {
  let s = texto.replace(/[\s$]/g, '');
  if (s === '') return null;

  if (s.includes(',') && s.includes('.')) {
    // "1,234.50": la coma separa miles.
    s = s.replace(/,/g, '');
  } else if (/^\d*,\d{1,2}$/.test(s)) {
    // "28,50": algunos teclados usan coma como punto decimal.
    s = s.replace(',', '.');
  } else {
    s = s.replace(/,/g, '');
  }

  const partes = /^(\d*)(?:\.(\d{0,2}))?$/.exec(s);
  if (!partes || (partes[1] === '' && !partes[2])) return null;

  const pesos = parseInt(partes[1] || '0', 10);
  const cent = parseInt(((partes[2] ?? '') + '00').slice(0, 2), 10);
  const total = pesos * 100 + cent;

  if (total <= 0 || total > PRECIO_MAXIMO_CENTAVOS) return null;
  return total;
}
