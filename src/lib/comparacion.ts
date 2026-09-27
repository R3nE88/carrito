import { esPrecioViejo } from './fechas';

/**
 * Calcula cuánto costaría el carrito en cada tienda.
 * Función pura (sin base de datos) para poder probarla fácilmente.
 */

export interface ItemAComparar {
  productoId: number;
  nombre: string;
  cantidad: number;
}

export interface PrecioAComparar {
  productoId: number;
  tiendaId: number;
  centavos: number;
  registradoEn: string;
}

export interface ResultadoTienda {
  tiendaId: number;
  nombre: string;
  /** Suma de los productos que sí tienen precio en esta tienda. */
  total: number;
  /** Productos del carrito sin precio registrado en esta tienda. */
  faltantes: string[];
  /** Cuántos de los precios usados tienen más de 60 días. */
  preciosViejos: number;
  /** Tiene precio para todos los productos comparados. */
  completa: boolean;
  /** La más barata entre las tiendas completas. */
  masBarata: boolean;
}

export interface ResultadoComparacion {
  tiendas: ResultadoTienda[];
  /** Productos distintos que se compararon. */
  productosComparados: number;
  /** Productos distintos en el carrito. */
  productosEnCarrito: number;
  /** Productos con precio en TODAS las tiendas. */
  productosEnComun: number;
}

export function calcularComparacion(
  tiendas: { id: number; nombre: string }[],
  items: ItemAComparar[],
  precios: PrecioAComparar[],
  opciones: { soloEnComun?: boolean; ahora?: Date } = {},
): ResultadoComparacion {
  const { soloEnComun = false, ahora = new Date() } = opciones;

  const mapa = new Map<string, PrecioAComparar>();
  for (const p of precios) mapa.set(`${p.productoId}:${p.tiendaId}`, p);

  const enComun = items.filter((item) =>
    tiendas.every((t) => mapa.has(`${item.productoId}:${t.id}`)),
  );
  const comparados = soloEnComun ? enComun : items;

  const resultados: ResultadoTienda[] = tiendas.map((tienda) => {
    let total = 0;
    let preciosViejos = 0;
    const faltantes: string[] = [];
    for (const item of comparados) {
      const precio = mapa.get(`${item.productoId}:${tienda.id}`);
      if (!precio) {
        faltantes.push(item.nombre);
        continue;
      }
      total += precio.centavos * item.cantidad;
      if (esPrecioViejo(precio.registradoEn, ahora)) preciosViejos++;
    }
    return {
      tiendaId: tienda.id,
      nombre: tienda.nombre,
      total,
      faltantes,
      preciosViejos,
      completa: comparados.length > 0 && faltantes.length === 0,
      masBarata: false,
    };
  });

  const completas = resultados.filter((r) => r.completa);
  if (completas.length > 0) {
    const minimo = Math.min(...completas.map((r) => r.total));
    for (const r of completas) r.masBarata = r.total === minimo;
  }

  // Primero las tiendas completas (de la más barata a la más cara), luego las que tienen faltantes.
  resultados.sort((a, b) => {
    if (a.completa !== b.completa) return a.completa ? -1 : 1;
    if (a.faltantes.length !== b.faltantes.length) return a.faltantes.length - b.faltantes.length;
    return a.total - b.total;
  });

  return {
    tiendas: resultados,
    productosComparados: comparados.length,
    productosEnCarrito: items.length,
    productosEnComun: enComun.length,
  };
}
