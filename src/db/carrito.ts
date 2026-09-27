import type { Db, ItemCarrito } from './tipos';

/** Productos del carrito con su precio en la tienda indicada (lo último agregado va primero). */
export async function listarCarrito(db: Db, tiendaId: number | null): Promise<ItemCarrito[]> {
  return db.getAllAsync<ItemCarrito>(
    `SELECT c.id, c.producto_id AS productoId, p.nombre, p.codigo, c.cantidad,
            pr.precio_centavos AS centavos, pr.registrado_en AS registradoEn
     FROM carrito c
     JOIN productos p ON p.id = c.producto_id
     LEFT JOIN precios pr ON pr.producto_id = c.producto_id AND pr.tienda_id = ?
     ORDER BY c.agregado_en DESC, c.id DESC`,
    tiendaId ?? -1,
  );
}

/** Agrega una unidad. Si ya estaba, suma 1 y lo sube al inicio de la lista. */
export async function agregarAlCarrito(db: Db, productoId: number, ahora: string): Promise<number> {
  await db.runAsync(
    `INSERT INTO carrito (producto_id, cantidad, agregado_en) VALUES (?, 1, ?)
     ON CONFLICT(producto_id) DO UPDATE SET cantidad = cantidad + 1, agregado_en = excluded.agregado_en`,
    productoId,
    ahora,
  );
  const fila = await db.getFirstAsync<{ cantidad: number }>(
    'SELECT cantidad FROM carrito WHERE producto_id = ?',
    productoId,
  );
  return fila?.cantidad ?? 1;
}

export async function cambiarCantidad(db: Db, itemId: number, cantidad: number): Promise<void> {
  if (cantidad < 1) return;
  await db.runAsync('UPDATE carrito SET cantidad = ? WHERE id = ?', Math.floor(cantidad), itemId);
}

export async function quitarDelCarrito(db: Db, itemId: number): Promise<void> {
  await db.runAsync('DELETE FROM carrito WHERE id = ?', itemId);
}

/** Vacía el carrito. Los productos y precios guardados NO se borran. */
export async function vaciarCarrito(db: Db): Promise<void> {
  await db.runAsync('DELETE FROM carrito');
}

/** Datos crudos para comparar el carrito entre tiendas. */
export async function datosComparacion(db: Db) {
  const items = await db.getAllAsync<{ productoId: number; nombre: string; cantidad: number }>(
    `SELECT c.producto_id AS productoId, p.nombre, c.cantidad
     FROM carrito c JOIN productos p ON p.id = c.producto_id
     ORDER BY p.nombre_normalizado`,
  );
  const precios = await db.getAllAsync<{
    productoId: number;
    tiendaId: number;
    centavos: number;
    registradoEn: string;
  }>(
    `SELECT pr.producto_id AS productoId, pr.tienda_id AS tiendaId,
            pr.precio_centavos AS centavos, pr.registrado_en AS registradoEn
     FROM precios pr WHERE pr.producto_id IN (SELECT producto_id FROM carrito)`,
  );
  return { items, precios };
}
