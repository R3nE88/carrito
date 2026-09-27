import type { Db, PrecioAnterior, PrecioEnTienda } from './tipos';

export async function obtenerPrecio(
  db: Db,
  productoId: number,
  tiendaId: number,
): Promise<{ centavos: number; registradoEn: string } | null> {
  return db.getFirstAsync(
    `SELECT precio_centavos AS centavos, registrado_en AS registradoEn
     FROM precios WHERE producto_id = ? AND tienda_id = ?`,
    productoId,
    tiendaId,
  );
}

/** Precio actual del producto en cada tienda donde está registrado (del más barato al más caro). */
export async function preciosDeProducto(db: Db, productoId: number): Promise<PrecioEnTienda[]> {
  return db.getAllAsync<PrecioEnTienda>(
    `SELECT pr.tienda_id AS tiendaId, t.nombre AS tiendaNombre,
            pr.precio_centavos AS centavos, pr.registrado_en AS registradoEn
     FROM precios pr JOIN tiendas t ON t.id = pr.tienda_id
     WHERE pr.producto_id = ?
     ORDER BY pr.precio_centavos, t.nombre COLLATE NOCASE`,
    productoId,
  );
}

/** Precios anteriores del producto, del más reciente al más antiguo. */
export async function historialDeProducto(db: Db, productoId: number): Promise<PrecioAnterior[]> {
  return db.getAllAsync<PrecioAnterior>(
    `SELECT h.id, h.tienda_id AS tiendaId, t.nombre AS tiendaNombre,
            h.precio_centavos AS centavos, h.registrado_en AS registradoEn
     FROM historial_precios h JOIN tiendas t ON t.id = h.tienda_id
     WHERE h.producto_id = ?
     ORDER BY h.registrado_en DESC, h.id DESC`,
    productoId,
  );
}

export type ResultadoGuardarPrecio = 'nuevo' | 'cambio' | 'igual';

/**
 * Guarda el precio de un producto en una tienda.
 * - Si no había precio, lo crea.
 * - Si cambió, manda el anterior (con su fecha) al historial.
 * - Si es igual, solo actualiza la fecha (el precio se confirmó hoy).
 *
 * No abre transacción: quien la llama debe envolverla (ver flujo.ts).
 */
export async function guardarPrecio(
  db: Db,
  productoId: number,
  tiendaId: number,
  centavos: number,
  ahora: string,
): Promise<ResultadoGuardarPrecio> {
  const anterior = await obtenerPrecio(db, productoId, tiendaId);

  if (!anterior) {
    await db.runAsync(
      `INSERT INTO precios (producto_id, tienda_id, precio_centavos, registrado_en)
       VALUES (?, ?, ?, ?)`,
      productoId,
      tiendaId,
      centavos,
      ahora,
    );
    return 'nuevo';
  }

  if (anterior.centavos !== centavos) {
    await db.runAsync(
      `INSERT INTO historial_precios (producto_id, tienda_id, precio_centavos, registrado_en)
       VALUES (?, ?, ?, ?)`,
      productoId,
      tiendaId,
      anterior.centavos,
      anterior.registradoEn,
    );
  }

  await db.runAsync(
    `UPDATE precios SET precio_centavos = ?, registrado_en = ?
     WHERE producto_id = ? AND tienda_id = ?`,
    centavos,
    ahora,
    productoId,
    tiendaId,
  );
  return anterior.centavos === centavos ? 'igual' : 'cambio';
}
