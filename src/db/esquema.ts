import type { Db } from './tipos';

export const NOMBRE_BASE_DATOS = 'carrito.db';

/**
 * Crea o actualiza las tablas. Se ejecuta cada vez que abre la app.
 * Para cambiar el esquema en el futuro, agrega un bloque `if (version < 2)`.
 */
export async function migrar(db: Db): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = fila?.user_version ?? 0;

  if (version < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tiendas (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre    TEXT NOT NULL,
        creada_en TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS productos (
        id                 INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo             TEXT UNIQUE,
        nombre             TEXT NOT NULL,
        nombre_normalizado TEXT NOT NULL,
        creado_en          TEXT NOT NULL
      );

      -- Precio actual de cada producto en cada tienda.
      CREATE TABLE IF NOT EXISTS precios (
        producto_id     INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
        tienda_id       INTEGER NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
        precio_centavos INTEGER NOT NULL,
        registrado_en   TEXT NOT NULL,
        PRIMARY KEY (producto_id, tienda_id)
      );

      -- Precios anteriores: cada vez que cambia un precio, el viejo se guarda aquí.
      CREATE TABLE IF NOT EXISTS historial_precios (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id     INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
        tienda_id       INTEGER NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
        precio_centavos INTEGER NOT NULL,
        registrado_en   TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS carrito (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        producto_id INTEGER NOT NULL UNIQUE REFERENCES productos(id) ON DELETE CASCADE,
        cantidad    INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
        agregado_en TEXT NOT NULL
      );

      -- Preferencias simples: tienda actual y presupuesto.
      CREATE TABLE IF NOT EXISTS ajustes (
        clave TEXT PRIMARY KEY,
        valor TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_precios_tienda ON precios (tienda_id);
      CREATE INDEX IF NOT EXISTS idx_historial_producto ON historial_precios (producto_id, tienda_id);
      CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos (nombre_normalizado);

      PRAGMA user_version = 1;
    `);
  }
}
