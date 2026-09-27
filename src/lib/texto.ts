const SIN_ACENTO: Record<string, string> = {
  á: 'a', à: 'a', ä: 'a', â: 'a',
  é: 'e', è: 'e', ë: 'e', ê: 'e',
  í: 'i', ì: 'i', ï: 'i', î: 'i',
  ó: 'o', ò: 'o', ö: 'o', ô: 'o',
  ú: 'u', ù: 'u', ü: 'u', û: 'u',
  ñ: 'n', ç: 'c',
};

/** Minúsculas y sin acentos, para buscar "platano" y encontrar "Plátano". */
export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/[áàäâéèëêíìïîóòöôúùüûñç]/g, (c) => SIN_ACENTO[c] ?? c)
    .replace(/\s+/g, ' ')
    .trim();
}

/** Limpia espacios de más en un nombre escrito por el usuario. */
export function limpiarNombre(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim();
}

/** "1 artículo", "3 artículos". */
export function plural(n: number, singular: string, varios: string): string {
  return `${n} ${n === 1 ? singular : varios}`;
}
