import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { espacio, letra, useColores } from '../theme/tema';

export type NombreIcono = ComponentProps<typeof Ionicons>['name'];
type Variante = 'primario' | 'secundario' | 'peligro' | 'suave';

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  icono?: NombreIcono;
  deshabilitado?: boolean;
  cargando?: boolean;
  /** Botón extra alto para la acción principal (por ejemplo, Escanear). */
  grande?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

/** Botón grande y fácil de tocar con el pulgar. */
export function Boton({
  titulo,
  onPress,
  variante = 'primario',
  icono,
  deshabilitado,
  cargando,
  grande,
  style,
  accessibilityHint,
}: Props) {
  const c = useColores();
  const estilos = {
    primario: { fondo: c.primario, texto: c.primarioTexto, borde: c.primario },
    secundario: { fondo: c.tarjeta, texto: c.texto, borde: c.borde },
    peligro: { fondo: c.tarjeta, texto: c.peligro, borde: c.peligro },
    suave: { fondo: c.tarjetaSuave, texto: c.texto, borde: c.tarjetaSuave },
  }[variante];
  const inactivo = deshabilitado || cargando;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactivo, busy: !!cargando }}
      style={({ pressed }) => [
        styles.boton,
        grande && styles.grande,
        { backgroundColor: estilos.fondo, borderColor: estilos.borde, opacity: inactivo ? 0.5 : pressed ? 0.75 : 1 },
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={estilos.texto} />
      ) : icono ? (
        <Ionicons name={icono} size={grande ? 28 : 22} color={estilos.texto} />
      ) : null}
      <Text
        style={[styles.texto, grande && styles.textoGrande, { color: estilos.texto }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {titulo}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    minHeight: espacio.botonAlto,
    borderRadius: espacio.radio,
    borderWidth: 2,
    paddingHorizontal: espacio.l,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.s,
  },
  grande: { minHeight: 68 },
  texto: { fontSize: letra.normal, fontWeight: '700', flexShrink: 1 },
  textoGrande: { fontSize: letra.grande },
});
