import { StyleSheet, Text, View } from 'react-native';
import type { PrecioEnTienda } from '../db/tipos';
import { formatoDinero } from '../lib/dinero';
import { esPrecioViejo, formatoFecha } from '../lib/fechas';
import { espacio, letra, useColores } from '../theme/tema';

/** Lista compacta con el precio del producto en otras tiendas, como referencia. */
export function ReferenciasPrecios({ precios }: { precios: PrecioEnTienda[] }) {
  const c = useColores();
  if (precios.length === 0) return null;

  return (
    <View style={[styles.caja, { backgroundColor: c.infoFondo }]}>
      <Text style={[styles.titulo, { color: c.info }]}>Precio en otras tiendas</Text>
      {precios.map((p) => (
        <View key={p.tiendaId} style={styles.fila}>
          <Text style={[styles.tienda, { color: c.texto }]} numberOfLines={1}>
            {p.tiendaNombre}
          </Text>
          <Text style={[styles.precio, { color: c.texto }]}>{formatoDinero(p.centavos)}</Text>
          <Text style={[styles.fecha, { color: esPrecioViejo(p.registradoEn) ? c.aviso : c.textoSuave }]}>
            {formatoFecha(p.registradoEn)}
            {esPrecioViejo(p.registradoEn) ? ' (viejo)' : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { borderRadius: 12, padding: espacio.m, gap: 6 },
  titulo: { fontSize: letra.chica, fontWeight: '800' },
  fila: { flexDirection: 'row', alignItems: 'baseline', gap: espacio.s },
  tienda: { flex: 1, fontSize: letra.chica + 1, fontWeight: '600' },
  precio: { fontSize: letra.normal, fontWeight: '800', fontVariant: ['tabular-nums'] },
  fecha: { fontSize: letra.chica - 1, minWidth: 92, textAlign: 'right' },
});
