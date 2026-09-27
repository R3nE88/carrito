import { DIAS_PRECIO_VIEJO } from './config';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MS_DIA = 24 * 60 * 60 * 1000;

/** Fecha y hora actual en formato ISO (así se guarda en la base de datos). */
export function ahoraISO(): string {
  return new Date().toISOString();
}

/** "2026-09-27T18:00:00.000Z" -> "27 sep 2026" (en la zona horaria del celular). */
export function formatoFecha(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

/** Días completos transcurridos desde la fecha indicada. */
export function diasDesde(iso: string, ahora: Date = new Date()): number {
  const inicio = new Date(iso);
  const a = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate()).getTime();
  const b = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
  return Math.max(0, Math.round((b - a) / MS_DIA));
}

/** Texto amigable: "hoy", "ayer", "hace 5 días", "hace 3 meses". */
export function haceCuanto(iso: string, ahora: Date = new Date()): string {
  const dias = diasDesde(iso, ahora);
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 60) return `hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  if (meses < 24) return `hace ${meses} meses`;
  return `hace ${Math.floor(dias / 365)} años`;
}

/** Un precio es "viejo" si se registró hace más de DIAS_PRECIO_VIEJO días. */
export function esPrecioViejo(iso: string, ahora: Date = new Date()): boolean {
  return diasDesde(iso, ahora) > DIAS_PRECIO_VIEJO;
}
