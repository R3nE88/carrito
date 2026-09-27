/**
 * Utilidades para códigos de barras EAN-13, UPC-A y EAN-8.
 *
 * Los UPC-A (12 dígitos) se guardan como EAN-13 agregando un 0 al inicio.
 * Así el mismo producto tiene el mismo código aunque lo lea un iPhone
 * (que reporta UPC-A como EAN-13) o un Android (que lo reporta como UPC-A).
 */

/** Revisa el dígito verificador (el último número) de un código EAN/UPC. */
export function digitoVerificadorValido(codigo: string): boolean {
  if (!/^\d+$/.test(codigo) || codigo.length < 8) return false;
  const digitos = codigo.split('').map(Number);
  const verificador = digitos.pop()!;
  let suma = 0;
  // De derecha a izquierda: posiciones impares x3, pares x1.
  digitos.reverse().forEach((d, i) => {
    suma += i % 2 === 0 ? d * 3 : d;
  });
  return (10 - (suma % 10)) % 10 === verificador;
}

/** Normaliza un código leído o escrito. Regresa null si no es EAN-13, UPC-A o EAN-8 válido. */
export function normalizarCodigo(texto: string): string | null {
  const codigo = texto.replace(/\D/g, '');
  if (![8, 12, 13].includes(codigo.length)) return null;
  if (!digitoVerificadorValido(codigo)) return null;
  return codigo.length === 12 ? `0${codigo}` : codigo;
}

export type ValidacionCodigo = { ok: true; codigo: string } | { ok: false; error: string };

/** Valida un código escrito a mano y explica el problema si lo hay. */
export function validarCodigoEscrito(texto: string): ValidacionCodigo {
  const codigo = texto.replace(/\D/g, '');
  if (codigo.length === 0) return { ok: false, error: 'Escribe los números del código.' };
  if (![8, 12, 13].includes(codigo.length)) {
    return {
      ok: false,
      error: `El código tiene ${codigo.length} dígitos. Debe tener 13 (EAN-13), 12 (UPC-A) u 8 (EAN-8).`,
    };
  }
  const normalizado = normalizarCodigo(codigo);
  if (!normalizado) {
    return { ok: false, error: 'El código no es válido. Revisa que los números estén bien escritos.' };
  }
  return { ok: true, codigo: normalizado };
}
