import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { letra, useColores } from '../theme/tema';
import type { NombreIcono } from './Boton';

type Tipo = 'barata' | 'ok' | 'vieja' | 'aviso' | 'info' | 'peligro';

/** Etiqueta pequeña de color: "Más barata", "Precio viejo", etc. */
export function Insignia({ texto, tipo }: { texto: string; tipo: Tipo }) {
  const c = useColores();
  const estilo: Record<Tipo, { fondo: string; color: string; icono: NombreIcono }> = {
    barata: { fondo: c.exitoFondo, color: c.exito, icono: 'ribbon-outline' },
    ok: { fondo: c.exitoFondo, color: c.exito, icono: 'checkmark-circle' },
    vieja: { fondo: c.avisoFondo, color: c.aviso, icono: 'time-outline' },
    aviso: { fondo: c.avisoFondo, color: c.aviso, icono: 'alert-circle' },
    info: { fondo: c.infoFondo, color: c.info, icono: 'information-circle-outline' },
    peligro: { fondo: c.peligroFondo, color: c.peligro, icono: 'alert-circle' },
  };
  const e = estilo[tipo];
  return (
    <View style={[styles.insignia, { backgroundColor: e.fondo }]}>
      <Ionicons name={e.icono} size={14} color={e.color} />
      <Text style={[styles.texto, { color: e.color }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  insignia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  texto: { fontSize: letra.chica - 1, fontWeight: '700' },
});
