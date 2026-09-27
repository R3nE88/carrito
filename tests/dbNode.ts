/**
 * Adaptador para usar el SQLite integrado de Node en las pruebas,
 * con las mismas funciones que usa la app de expo-sqlite.
 */
import { DatabaseSync } from 'node:sqlite';
import type { Db } from '../src/db/tipos';

type Parametro = string | number | null;

function aplanar(params: unknown[]): Parametro[] {
  if (params.length === 1 && Array.isArray(params[0])) return params[0] as Parametro[];
  return params as Parametro[];
}

export function crearDbPrueba(): Db {
  const sqlite = new DatabaseSync(':memory:');

  const db = {
    async execAsync(sql: string) {
      sqlite.exec(sql);
    },
    async runAsync(sql: string, ...params: unknown[]) {
      const r = sqlite.prepare(sql).run(...aplanar(params));
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
    async getFirstAsync(sql: string, ...params: unknown[]) {
      const fila = sqlite.prepare(sql).get(...aplanar(params));
      return fila ? { ...fila } : null;
    },
    async getAllAsync(sql: string, ...params: unknown[]) {
      return sqlite.prepare(sql).all(...aplanar(params)).map((f) => ({ ...f }));
    },
    async withTransactionAsync(tarea: () => Promise<void>) {
      sqlite.exec('BEGIN');
      try {
        await tarea();
        sqlite.exec('COMMIT');
      } catch (e) {
        sqlite.exec('ROLLBACK');
        throw e;
      }
    },
  };
  return db as unknown as Db;
}
