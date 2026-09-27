import { ErrorUsuario } from '../lib/errores';
import { ahoraISO } from '../lib/fechas';
import { limpiarNombre, normalizarTexto } from '../lib/texto';
import type { Db, Producto, ProductoResumen } from './tipos';

const COLUMNAS = 'id, codigo, nombre';

export async function obtenerProducto(db: Db, id: number): Promise<Producto | null> {
  return db.getFirstAsync<Producto>(`SELECT ${COLUMNAS} FROM productos WHERE id = ?`, id);
}

export async function buscarPorCodigo(db: Db, codigo: string): Promise<Producto | null> {
  return db.getFirstAsync<Producto>(`SELECT ${COLUMNAS} FROM productos WHERE codigo = ?`, codigo);
}

/** Producto sin código con exactamente ese nombre (para no duplicar "Plátano"). */
export async function buscarSinCodigoPorNombre(db: Db, nombre: string): Promise<Producto | null> {
  return db.getFirstAsync<Producto>(
    `SELECT ${COLUMNAS} FROM productos WHERE codigo IS NULL AND nombre_normalizado = ?`,
    normalizarTexto(nombre),
  );
}

export async function crearProducto(
  db: Db,
  datos: { codigo: string | null; nombre: string },
): Promise<number> {
  const nombre = limpiarNombre(datos.nombre);
  if (!nombre) throw new ErrorUsuario('Escribe el nombre del producto.');
  const r = await db.runAsync(
    'INSERT INTO productos (codigo, nombre, nombre_normalizado, creado_en) VALUES (?, ?, ?, ?)',
    datos.codigo,
    nombre,
    normalizarTexto(nombre),
    ahoraISO(),
  );
  return r.lastInsertRowId;
}

export async function renombrarProducto(db: Db, id: number, nombre: string): Promise<void> {
  const limpio = limpiarNombre(nombre);
  if (!limpio) throw new ErrorUsuario('Escribe el nombre del producto.');
  await db.runAsync(
    'UPDATE productos SET nombre = ?, nombre_normalizado = ? WHERE id = ?',
    limpio,
    normalizarTexto(limpio),
    id,
  );
}

/** Borra el producto con sus precios, historial y su lugar en el carrito. */
export async function eliminarProducto(db: Db, id: number): Promise<void> {
  await db.runAsync('DELETE FROM productos WHERE id = ?', id);
}

/**
 * Lista productos para "Mis productos". Busca por nombre (sin importar acentos)
 * o por código. Cada palabra escrita debe aparecer en el nombre.
 */
export async function listarProductos(
  db: Db,
  busqueda = '',
  limite = 300,
): Promise<ProductoResumen[]> {
  const palabras = normalizarTexto(busqueda)
    .replace(/[%_]/g, '')
    .split(' ')
    .filter(Boolean);

  const condiciones: string[] = [];
  const parametros: (string | number)[] = [];
  for (const palabra of palabras) {
    condiciones.push('(p.nombre_normalizado LIKE ? OR p.codigo LIKE ?)');
    parametros.push(`%${palabra}%`, `%${palabra}%`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  parametros.push(limite);

  return db.getAllAsync<ProductoResumen>(
    `SELECT p.id, p.codigo, p.nombre,
       (SELECT COUNT(*) FROM precios pr WHERE pr.producto_id = p.id) AS tiendasConPrecio,
       (SELECT MIN(pr.precio_centavos) FROM precios pr WHERE pr.producto_id = p.id) AS minCentavos,
       (SELECT t.nombre FROM precios pr JOIN tiendas t ON t.id = pr.tienda_id
          WHERE pr.producto_id = p.id
          ORDER BY pr.precio_centavos, t.nombre COLLATE NOCASE LIMIT 1) AS minTienda
     FROM productos p
     ${where}
     ORDER BY p.nombre_normalizado
     LIMIT ?`,
    parametros,
  );
}
