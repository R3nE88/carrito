import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatoDinero } from '../lib/dinero';
import { espacio, letra, useColores } from '../theme/tema';

export interface Aviso {
  /** Cambia en cada aviso para reiniciar el temporizador. */
  id: number;
  titulo: string;
  nombre: string;
  centavos?: number;
  cantidad?: number;
  precioViejo?: boolean;
}

interface Props {
  aviso: Aviso | null;
  onOcultar: () => void;
  /** Milisegundos antes de ocultarse. */
  duracion?: number;
}

/** Mensaje breve de confirmación: "Agregado: Leche Lala $28.50". */
export function AvisoFlotante({ aviso, onOcultar, duracion = 4000 }: Props) {
  const c = useColores();

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(onOcultar, duracion);
    return () => clearTimeout(t);
  }, [aviso, duracion, onOcultar]);

  if (!aviso) return null;
  return (
    <View
      style={[styles.aviso, { backgroundColor: c.exitoFondo, borderColor: c.exito }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      testID="aviso"
    >
      <Ionicons name="checkmark-circle" size={30} color={c.exito} />
      <View style={styles.textos}>
        <Text style={[styles.titulo, { color: c.exito }]}>{aviso.titulo}</Text>
        <Text style={[styles.nombre, { color: c.texto }]} numberOfLines={2}>
          {aviso.nombre}
          {aviso.centavos !== undefined ? `  ${formatoDinero(aviso.centavos)}` : ''}
        </Text>
        {aviso.cantidad && aviso.cantidad > 1 ? (
          <Text style={[styles.extra, { color: c.textoSuave }]}>Llevas {aviso.cantidad} en el carrito</Text>
        ) : null}
        {aviso.precioViejo ? (
          <Text style={[styles.extra, { color: c.aviso }]}>Precio viejo: tócalo en el carrito para confirmarlo</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    borderRadius: 16,
    borderWidth: 2,
    padding: espacio.m,
  },
  textos: { flex: 1, gap: 2 },
  titulo: { fontSize: letra.chica, fontWeight: '800', textTransform: 'uppercase' },
  nombre: { fontSize: letra.normal, fontWeight: '700' },
  extra: { fontSize: letra.chica },
});
