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

export const coloresClaros: Colores = {
  fondo: '#F4F6F5',
  tarjeta: '#FFFFFF',
  tarjetaSuave: '#EBEFED',
  texto: '#111816',
  textoSuave: '#56625E',
  borde: '#D9DFDC',
  primario: '#0B7A43',
  primarioTexto: '#FFFFFF',
  peligro: '#C62828',
  peligroFondo: '#FDECEA',
  aviso: '#9A5B00',
  avisoFondo: '#FFF3D6',
  exito: '#0B7A43',
  exitoFondo: '#DDF3E6',
  info: '#1F5FAD',
  infoFondo: '#E3EEFB',
  velo: 'rgba(0,0,0,0.45)',
};

export const coloresOscuros: Colores = {
  fondo: '#101413',
  tarjeta: '#1B211F',
  tarjetaSuave: '#252D2A',
  texto: '#F1F5F3',
  textoSuave: '#A5B1AC',
  borde: '#33403B',
  primario: '#35C27A',
  primarioTexto: '#07130D',
  peligro: '#FF6B61',
  peligroFondo: '#3A1714',
  aviso: '#F5B941',
  avisoFondo: '#3A2C0C',
  exito: '#35C27A',
  exitoFondo: '#12301F',
  info: '#79B0F2',
  infoFondo: '#15263D',
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
