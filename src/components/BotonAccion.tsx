import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { letra, useColores } from '../theme/tema';
import type { NombreIcono } from './Boton';

interface Props {
  titulo: string;
  icono: NombreIcono;
  onPress: () => void;
  deshabilitado?: boolean;
}

/** Botón cuadrado con ícono arriba y texto abajo, para la barra inferior. */
export function BotonAccion({ titulo, icono, onPress, deshabilitado }: Props) {
  const c = useColores();
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: !!deshabilitado }}
      style={({ pressed }) => [
        styles.boton,
        { backgroundColor: c.tarjetaSuave, opacity: deshabilitado ? 0.4 : pressed ? 0.7 : 1 },
      ]}
    >
      <Ionicons name={icono} size={26} color={c.primario} />
      <Text style={[styles.texto, { color: c.texto }]} numberOfLines={2}>
        {titulo}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    flex: 1,
    minHeight: 72,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 8,
    gap: 4,
  },
  texto: { fontSize: letra.chica, fontWeight: '700', textAlign: 'center' },
});
