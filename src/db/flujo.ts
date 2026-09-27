import { ahoraISO } from '../lib/fechas';
import { agregarAlCarrito } from './carrito';
import { guardarPrecio, obtenerPrecio, preciosDeProducto, type ResultadoGuardarPrecio } from './precios';
import { buscarPorCodigo, buscarSinCodigoPorNombre, crearProducto } from './productos';
import type { Db, PrecioEnTienda, Producto } from './tipos';

/**
 * Acciones completas de la compra. Cada una corre en una transacción:
 * o se guarda todo, o no se guarda nada.
 */

export type ResultadoCodigo =
  /** Ya tenía precio en esta tienda: se agregó solo. */
  | { tipo: 'agregado'; producto: Producto; centavos: number; registradoEn: string; cantidad: number }
  /** Existe, pero falta su precio en esta tienda. */
  | { tipo: 'pedir-precio'; producto: Producto; referencias: PrecioEnTienda[] }
  /** Producto nuevo: hay que pedir nombre y precio. */
  | { tipo: 'nuevo'; codigo: string };

/** Decide qué hacer con un código escaneado o escrito. */
export async function procesarCodigo(
  db: Db,
  codigo: string,
  tiendaId: number,
  ahora: string = ahoraISO(),
): Promise<ResultadoCodigo> {
  const producto = await buscarPorCodigo(db, codigo);
  if (!producto) return { tipo: 'nuevo', codigo };
  return procesarProducto(db, producto, tiendaId, ahora);
}

/** Igual que procesarCodigo, pero con un producto ya conocido (por ejemplo, desde "Mis productos"). */
export async function procesarProducto(
  db: Db,
  producto: Producto,
  tiendaId: number,
  ahora: string = ahoraISO(),
): Promise<ResultadoCodigo> {
  const precio = await obtenerPrecio(db, producto.id, tiendaId);
  if (precio) {
    const cantidad = await agregarAlCarrito(db, producto.id, ahora);
    return { tipo: 'agregado', producto, ...precio, cantidad };
  }
  const referencias = (await preciosDeProducto(db, producto.id)).filter((p) => p.tiendaId !== tiendaId);
  return { tipo: 'pedir-precio', producto, referencias };
}

/** Guarda un producto nuevo (con o sin código), su precio en la tienda y lo agrega al carrito. */
export async function registrarProductoNuevo(
  db: Db,
  datos: { codigo: string | null; nombre: string; centavos: number; tiendaId: number },
  ahora: string = ahoraISO(),
): Promise<{ productoId: number; cantidad: number }> {
  let resultado = { productoId: 0, cantidad: 0 };
  await db.withTransactionAsync(async () => {
    // Un producto sin código con el mismo nombre se reutiliza en lugar de duplicarse.
    const existente = datos.codigo
      ? await buscarPorCodigo(db, datos.codigo)
      : await buscarSinCodigoPorNombre(db, datos.nombre);
    const productoId =
      existente?.id ?? (await crearProducto(db, { codigo: datos.codigo, nombre: datos.nombre }));
    await guardarPrecio(db, productoId, datos.tiendaId, datos.centavos, ahora);
    const cantidad = await agregarAlCarrito(db, productoId, ahora);
    resultado = { productoId, cantidad };
  });
  return resultado;
}

/** Guarda el precio de un producto existente en la tienda y lo agrega al carrito. */
export async function registrarPrecioYAgregar(
  db: Db,
  productoId: number,
  tiendaId: number,
  centavos: number,
  ahora: string = ahoraISO(),
): Promise<number> {
  let cantidad = 0;
  await db.withTransactionAsync(async () => {
    await guardarPrecio(db, productoId, tiendaId, centavos, ahora);
    cantidad = await agregarAlCarrito(db, productoId, ahora);
  });
  return cantidad;
}

/** Cambia el precio guardado (el anterior pasa al historial). */
export async function actualizarPrecio(
  db: Db,
  productoId: number,
  tiendaId: number,
  centavos: number,
  ahora: string = ahoraISO(),
): Promise<ResultadoGuardarPrecio> {
  let resultado: ResultadoGuardarPrecio = 'igual';
  await db.withTransactionAsync(async () => {
    resultado = await guardarPrecio(db, productoId, tiendaId, centavos, ahora);
  });
  return resultado;
}
