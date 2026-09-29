import { useColorScheme } from 'react-native';

/**
 * Colores y tamaños de la app. Cambia aquí para ajustar el diseño en todas las pantallas.
 * El modo oscuro se activa solo, según la configuración del celular.
 */

export interface Colores {
  fondo: string;
  tarjeta: string;
  tarjetaSuave: string;
  texto: string;
  textoSuave: string;
  borde: string;
  primario: string;
  primarioTexto: string;
  peligro: string;
  peligroFondo: string;
  aviso: string;
  avisoFondo: string;
  exito: string;
  exitoFondo: string;
  info: string;
  infoFondo: string;
  velo: string;
}

/** Azul del ícono de la app: color principal (botones, tienda, acciones). */
const AZUL = '#1764EE';

export const coloresClaros: Colores = {
  fondo: '#F3F6FB',
  tarjeta: '#FFFFFF',
  tarjetaSuave: '#E9EEF7',
  texto: '#0F172A',
  textoSuave: '#536078',
  borde: '#D5DDEA',
  primario: AZUL,
  primarioTexto: '#FFFFFF',
  peligro: '#C62828',
  peligroFondo: '#FDECEA',
  aviso: '#9A5B00',
  avisoFondo: '#FFF3D6',
  // El verde se reserva para "más barata" y confirmaciones.
  exito: '#0B7A43',
  exitoFondo: '#DDF3E6',
  info: '#1557D6',
  infoFondo: '#E4EDFD',
  velo: 'rgba(0,0,0,0.45)',
};

export const coloresOscuros: Colores = {
  fondo: '#0D1320',
  tarjeta: '#172033',
  tarjetaSuave: '#212C42',
  texto: '#EEF2F9',
  textoSuave: '#A2AEC4',
  borde: '#2E3A53',
  primario: '#5B9BFF',
  primarioTexto: '#06122B',
  peligro: '#FF6B61',
  peligroFondo: '#3A1714',
  aviso: '#F5B941',
  avisoFondo: '#3A2C0C',
  exito: '#35C27A',
  exitoFondo: '#12301F',
  info: '#8AB4FF',
  infoFondo: '#16264A',
  velo: 'rgba(0,0,0,0.65)',
};

/** Tamaños de letra (pensados para leerse fácil en el súper). */
export const letra = {
  chica: 15,
  normal: 18,
  grande: 22,
  titulo: 26,
  total: 44,
};

/** Espacios y alto mínimo de botones (tocables con el pulgar). */
export const espacio = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  botonAlto: 56,
  radio: 14,
};

export function useColores(): Colores {
  return useColorScheme() === 'dark' ? coloresOscuros : coloresClaros;
}
