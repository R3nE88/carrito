import { ErrorUsuario } from '../lib/errores';
import { ahoraISO } from '../lib/fechas';
import { limpiarNombre, normalizarTexto } from '../lib/texto';
import type { Db, Tienda } from './tipos';

export async function listarTiendas(db: Db): Promise<Tienda[]> {
  return db.getAllAsync<Tienda>('SELECT id, nombre FROM tiendas ORDER BY nombre COLLATE NOCASE');
}

/** Revisa que el nombre no esté vacío ni repetido. Lanza un Error con mensaje para el usuario. */
async function validarNombre(db: Db, nombre: string, idActual?: number): Promise<string> {
  const limpio = limpiarNombre(nombre);
  if (!limpio) throw new ErrorUsuario('Escribe el nombre de la tienda.');
  const tiendas = await listarTiendas(db);
  const repetida = tiendas.find(
    (t) => t.id !== idActual && normalizarTexto(t.nombre) === normalizarTexto(limpio),
  );
  if (repetida) throw new ErrorUsuario(`Ya tienes una tienda llamada "${repetida.nombre}".`);
  return limpio;
}

export async function crearTienda(db: Db, nombre: string): Promise<number> {
  const limpio = await validarNombre(db, nombre);
  const r = await db.runAsync(
    'INSERT INTO tiendas (nombre, creada_en) VALUES (?, ?)',
    limpio,
    ahoraISO(),
  );
  return r.lastInsertRowId;
}

export async function renombrarTienda(db: Db, id: number, nombre: string): Promise<void> {
  const limpio = await validarNombre(db, nombre, id);
  await db.runAsync('UPDATE tiendas SET nombre = ? WHERE id = ?', limpio, id);
}

/** Borra la tienda y, en cascada, sus precios e historial. */
export async function eliminarTienda(db: Db, id: number): Promise<void> {
  await db.runAsync('DELETE FROM tiendas WHERE id = ?', id);
}

export async function contarPreciosDeTienda(db: Db, id: number): Promise<number> {
  const fila = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM precios WHERE tienda_id = ?',
    id,
  );
  return fila?.n ?? 0;
}
