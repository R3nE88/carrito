import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { espacio, letra, useColores } from '../theme/tema';

interface CampoProps extends TextInputProps {
  etiqueta?: string;
  ayuda?: string;
  error?: string | null;
}

/** Campo de texto grande con etiqueta, ayuda y mensaje de error. */
export const CampoTexto = forwardRef<TextInput, CampoProps>(function CampoTexto(
  { etiqueta, ayuda, error, style, ...props },
  ref,
) {
  const c = useColores();
  return (
    <View style={styles.grupo}>
      {etiqueta ? <Text style={[styles.etiqueta, { color: c.textoSuave }]}>{etiqueta}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor={c.textoSuave}
        accessibilityLabel={etiqueta}
        {...props}
        style={[
          styles.campo,
          { color: c.texto, backgroundColor: c.fondo, borderColor: error ? c.peligro : c.borde },
          style,
        ]}
      />
      {error ? (
        <Text style={[styles.ayuda, { color: c.peligro }]} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : ayuda ? (
        <Text style={[styles.ayuda, { color: c.textoSuave }]}>{ayuda}</Text>
      ) : null}
    </View>
  );
});

/** Campo para escribir un precio con teclado numérico y el signo $ al frente. */
export const CampoPrecio = forwardRef<TextInput, CampoProps>(function CampoPrecio(
  { etiqueta = 'Precio', ayuda, error, ...props },
  ref,
) {
  const c = useColores();
  return (
    <View style={styles.grupo}>
      <Text style={[styles.etiqueta, { color: c.textoSuave }]}>{etiqueta}</Text>
      <View
        style={[
          styles.precioCaja,
          { backgroundColor: c.fondo, borderColor: error ? c.peligro : c.borde },
        ]}
      >
        <Text style={[styles.signo, { color: c.textoSuave }]}>$</Text>
        <TextInput
          ref={ref}
          keyboardType="decimal-pad"
          inputMode="decimal"
          placeholder="0.00"
          placeholderTextColor={c.textoSuave}
          accessibilityLabel={etiqueta}
          maxLength={10}
          selectTextOnFocus
          {...props}
          style={[styles.precio, { color: c.texto }]}
        />
      </View>
      {error ? (
        <Text style={[styles.ayuda, { color: c.peligro }]} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : ayuda ? (
        <Text style={[styles.ayuda, { color: c.textoSuave }]}>{ayuda}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  grupo: { gap: 6 },
  etiqueta: { fontSize: letra.chica, fontWeight: '700' },
  campo: {
    minHeight: espacio.botonAlto,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: espacio.m,
    fontSize: letra.grande,
  },
  precioCaja: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: espacio.m,
    minHeight: 64,
  },
  signo: { fontSize: 30, fontWeight: '700', marginRight: 4 },
  // minWidth: 0 permite que el campo se encoja dentro de la fila (necesario en web).
  precio: { flex: 1, minWidth: 0, fontSize: 32, fontWeight: '800', paddingVertical: espacio.s },
  ayuda: { fontSize: letra.chica },
});
