import type { Db } from './tipos';

export const AJUSTE_TIENDA_ACTUAL = 'tienda_actual';
export const AJUSTE_PRESUPUESTO = 'presupuesto_centavos';

export async function leerAjuste(db: Db, clave: string): Promise<string | null> {
  const fila = await db.getFirstAsync<{ valor: string | null }>(
    'SELECT valor FROM ajustes WHERE clave = ?',
    clave,
  );
  return fila?.valor ?? null;
}

export async function guardarAjuste(db: Db, clave: string, valor: string | null): Promise<void> {
  if (valor === null) {
    await db.runAsync('DELETE FROM ajustes WHERE clave = ?', clave);
  } else {
    await db.runAsync(
      'INSERT INTO ajustes (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor',
      clave,
      valor,
    );
  }
}

/** Lee un ajuste numérico (por ejemplo, un id o una cantidad en centavos). */
export async function leerAjusteNumero(db: Db, clave: string): Promise<number | null> {
  const valor = await leerAjuste(db, clave);
  const numero = valor === null ? NaN : Number(valor);
  return Number.isFinite(numero) ? numero : null;
}
