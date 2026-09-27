import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { useColores } from '../theme/tema';
import type { NombreIcono } from './Boton';

interface Props {
  icono: NombreIcono;
  etiqueta: string;
  onPress: () => void;
  color?: string;
  fondo?: string;
  deshabilitado?: boolean;
  tamano?: number;
  /** Texto pequeño debajo del ícono (opcional). */
  texto?: string;
  style?: StyleProp<ViewStyle>;
}

/** Botón cuadrado con ícono (48x48 como mínimo, para tocarlo sin fallar). */
export function BotonIcono({ icono, etiqueta, onPress, color, fondo, deshabilitado, tamano = 26, texto, style }: Props) {
  const c = useColores();
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: !!deshabilitado }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.boton,
        { backgroundColor: fondo ?? c.tarjetaSuave, opacity: deshabilitado ? 0.35 : pressed ? 0.6 : 1 },
        style,
      ]}
    >
      <Ionicons name={icono} size={tamano} color={color ?? c.texto} />
      {texto ? (
        <Text style={[styles.texto, { color: color ?? c.texto }]} numberOfLines={1}>
          {texto}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    minWidth: 48,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  texto: { fontSize: 11, fontWeight: '700', marginTop: 1 },
});
