/**
 * Ajustes generales de la app. Cambia aquí los valores para personalizarla.
 */

/** Si el mismo código se lee otra vez antes de este tiempo (ms), se ignora. */
export const DUPLICADO_MS = 2000;

/** A partir de cuántos días un precio se marca como "precio viejo". */
export const DIAS_PRECIO_VIEJO = 60;

/** Tiempo máximo (ms) para esperar la respuesta de Open Food Facts. */
export const OFF_TIMEOUT_MS = 6000;

/** Tipos de código de barras que lee el escáner. */
export const TIPOS_CODIGO = ['ean13', 'upc_a', 'ean8'] as const;

/** Precio máximo aceptado en centavos ($999,999.99), para evitar errores de dedo. */
export const PRECIO_MAXIMO_CENTAVOS = 99_999_999;
