import { OFF_TIMEOUT_MS } from './config';

/**
 * Consulta el nombre de un producto en la base pública de Open Food Facts.
 * https://world.openfoodfacts.org/api/v2/product/{codigo}.json
 */

export type BusquedaNombre =
  | { estado: 'encontrado'; nombre: string }
  | { estado: 'no-encontrado' }
  | { estado: 'sin-conexion' }
  | { estado: 'error' };

interface ProductoOFF {
  product_name?: string;
  product_name_es?: string;
  generic_name?: string;
  generic_name_es?: string;
  brands?: string;
  quantity?: string;
}

const CAMPOS = 'product_name,product_name_es,generic_name,generic_name_es,brands,quantity';

/** Arma un nombre útil: "Leche entera Lala 1 L". */
export function armarNombre(p: ProductoOFF): string {
  const base = (p.product_name_es || p.product_name || p.generic_name_es || p.generic_name || '').trim();
  const marca = (p.brands ?? '').split(',')[0].trim();
  const cantidad = (p.quantity ?? '').trim();

  let nombre = base;
  if (marca && !nombre.toLowerCase().includes(marca.toLowerCase())) {
    nombre = nombre ? `${nombre} ${marca}` : marca;
  }
  if (nombre && cantidad && !nombre.toLowerCase().includes(cantidad.toLowerCase())) {
    nombre = `${nombre} ${cantidad}`;
  }
  return nombre.replace(/\s+/g, ' ').trim();
}

export interface OpcionesBusqueda {
  fetchFn?: typeof fetch;
  timeoutMs?: number;
  /** Open Food Facts pide identificar la app. Solo se manda en iPhone/Android. */
  userAgent?: string;
}

export async function buscarNombreProducto(
  codigo: string,
  { fetchFn = fetch, timeoutMs = OFF_TIMEOUT_MS, userAgent }: OpcionesBusqueda = {},
): Promise<BusquedaNombre> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(codigo)}.json?fields=${CAMPOS}`;
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), timeoutMs);

  try {
    const respuesta = await fetchFn(url, {
      signal: control.signal,
      headers: userAgent ? { 'User-Agent': userAgent } : undefined,
    });
    if (respuesta.status === 404) return { estado: 'no-encontrado' };
    if (!respuesta.ok) return { estado: 'error' };

    const datos = (await respuesta.json()) as { status?: number; product?: ProductoOFF };
    if (datos.status !== 1 || !datos.product) return { estado: 'no-encontrado' };

    const nombre = armarNombre(datos.product);
    return nombre ? { estado: 'encontrado', nombre } : { estado: 'no-encontrado' };
  } catch (e) {
    // Sin internet, tiempo agotado o red caída: se pide el nombre a mano.
    if (e instanceof SyntaxError) return { estado: 'error' };
    return { estado: 'sin-conexion' };
  } finally {
    clearTimeout(temporizador);
  }
}
