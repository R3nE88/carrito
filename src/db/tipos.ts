import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Solo las funciones de expo-sqlite que usa la app.
 * Así las pruebas pueden usar otra implementación de SQLite.
 */
export type Db = Pick<
  SQLiteDatabase,
  'execAsync' | 'runAsync' | 'getFirstAsync' | 'getAllAsync' | 'withTransactionAsync'
>;

export interface Tienda {
  id: number;
  nombre: string;
}

export interface Producto {
  id: number;
  /** null para productos sin código (frutas, verduras, granel). */
  codigo: string | null;
  nombre: string;
}

/** Precio actual de un producto en una tienda. */
export interface PrecioEnTienda {
  tiendaId: number;
  tiendaNombre: string;
  centavos: number;
  registradoEn: string;
}

/** Precio anterior guardado en el historial. */
export interface PrecioAnterior extends PrecioEnTienda {
  id: number;
}

export interface ItemCarrito {
  id: number;
  productoId: number;
  nombre: string;
  codigo: string | null;
  cantidad: number;
  /** Precio en la tienda actual; null si no está registrado ahí. */
  centavos: number | null;
  registradoEn: string | null;
}

export interface ProductoResumen extends Producto {
  tiendasConPrecio: number;
  minCentavos: number | null;
  minTienda: string | null;
}
