import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AJUSTE_PRESUPUESTO,
  AJUSTE_TIENDA_ACTUAL,
  guardarAjuste,
  leerAjusteNumero,
} from '../db/ajustes';
import * as carritoDb from '../db/carrito';
import * as tiendasDb from '../db/tiendas';
import type { Db, ItemCarrito, Tienda } from '../db/tipos';

/**
 * Estado compartido de la compra: tiendas, tienda actual, carrito y presupuesto.
 * Todas las pantallas lo leen con `useCompra()`.
 */
interface CompraValor {
  db: Db;
  listo: boolean;
  tiendas: Tienda[];
  tiendaActual: Tienda | null;
  items: ItemCarrito[];
  /** Suma de los productos con precio (centavos). */
  total: number;
  /** Número de piezas en el carrito. */
  articulos: number;
  /** Productos del carrito sin precio en la tienda actual. */
  sinPrecio: number;
  presupuesto: number | null;

  recargar: () => Promise<void>;
  elegirTienda: (id: number | null) => Promise<void>;
  definirPresupuesto: (centavos: number | null) => Promise<void>;
  cambiarCantidad: (itemId: number, cantidad: number) => Promise<void>;
  quitar: (itemId: number) => Promise<void>;
  terminarCompra: () => Promise<void>;
  crearTienda: (nombre: string) => Promise<number>;
  renombrarTienda: (id: number, nombre: string) => Promise<void>;
  eliminarTienda: (id: number) => Promise<void>;
}

const CompraContext = createContext<CompraValor | null>(null);

const VACIO: Estado = { tiendas: [], tiendaId: null, items: [], presupuesto: null };

interface Estado {
  tiendas: Tienda[];
  tiendaId: number | null;
  items: ItemCarrito[];
  presupuesto: number | null;
}

/** Lee de la base de datos todo lo que muestra la compra. */
async function leerEstado(db: Db): Promise<Estado> {
  const tiendas = await tiendasDb.listarTiendas(db);
  let tiendaId = await leerAjusteNumero(db, AJUSTE_TIENDA_ACTUAL);
  if (tiendaId !== null && !tiendas.some((t) => t.id === tiendaId)) tiendaId = null;
  const [items, presupuesto] = await Promise.all([
    carritoDb.listarCarrito(db, tiendaId),
    leerAjusteNumero(db, AJUSTE_PRESUPUESTO),
  ]);
  return { tiendas, tiendaId, items, presupuesto };
}

export function CompraProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [estado, setEstado] = useState<Estado | null>(null);

  const recargar = useCallback(async () => {
    setEstado(await leerEstado(db));
  }, [db]);

  useEffect(() => {
    let activo = true;
    leerEstado(db).then((e) => {
      if (activo) setEstado(e);
    });
    return () => {
      activo = false;
    };
  }, [db]);

  const elegirTienda = useCallback(
    async (id: number | null) => {
      await guardarAjuste(db, AJUSTE_TIENDA_ACTUAL, id === null ? null : String(id));
      await recargar();
    },
    [db, recargar],
  );

  const definirPresupuesto = useCallback(
    async (centavos: number | null) => {
      await guardarAjuste(db, AJUSTE_PRESUPUESTO, centavos === null ? null : String(centavos));
      await recargar();
    },
    [db, recargar],
  );

  const cambiarCantidad = useCallback(
    async (itemId: number, cantidad: number) => {
      await carritoDb.cambiarCantidad(db, itemId, cantidad);
      await recargar();
    },
    [db, recargar],
  );

  const quitar = useCallback(
    async (itemId: number) => {
      await carritoDb.quitarDelCarrito(db, itemId);
      await recargar();
    },
    [db, recargar],
  );

  /** Vacía el carrito y pide elegir tienda en la siguiente compra. Los precios se conservan. */
  const terminarCompra = useCallback(async () => {
    await carritoDb.vaciarCarrito(db);
    await guardarAjuste(db, AJUSTE_TIENDA_ACTUAL, null);
    await recargar();
  }, [db, recargar]);

  const crearTienda = useCallback(
    async (nombre: string) => {
      const id = await tiendasDb.crearTienda(db, nombre);
      await recargar();
      return id;
    },
    [db, recargar],
  );

  const renombrarTienda = useCallback(
    async (id: number, nombre: string) => {
      await tiendasDb.renombrarTienda(db, id, nombre);
      await recargar();
    },
    [db, recargar],
  );

  const eliminarTienda = useCallback(
    async (id: number) => {
      await tiendasDb.eliminarTienda(db, id);
      await recargar();
    },
    [db, recargar],
  );

  const valor = useMemo<CompraValor>(() => {
    const { tiendas, tiendaId, items, presupuesto } = estado ?? VACIO;
    let total = 0;
    let articulos = 0;
    let sinPrecio = 0;
    for (const item of items) {
      articulos += item.cantidad;
      if (item.centavos === null) sinPrecio++;
      else total += item.centavos * item.cantidad;
    }
    return {
      db,
      listo: estado !== null,
      tiendas,
      tiendaActual: tiendas.find((t) => t.id === tiendaId) ?? null,
      items,
      total,
      articulos,
      sinPrecio,
      presupuesto,
      recargar,
      elegirTienda,
      definirPresupuesto,
      cambiarCantidad,
      quitar,
      terminarCompra,
      crearTienda,
      renombrarTienda,
      eliminarTienda,
    };
  }, [
    db, estado, recargar, elegirTienda, definirPresupuesto,
    cambiarCantidad, quitar, terminarCompra, crearTienda, renombrarTienda, eliminarTienda,
  ]);

  return <CompraContext.Provider value={valor}>{children}</CompraContext.Provider>;
}

export function useCompra(): CompraValor {
  const valor = useContext(CompraContext);
  if (!valor) throw new Error('useCompra debe usarse dentro de <CompraProvider>');
  return valor;
}
