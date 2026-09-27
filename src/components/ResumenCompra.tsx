import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCompra } from '../context/CompraContext';
import { formatoDinero } from '../lib/dinero';
import { plural } from '../lib/texto';
import { espacio, letra, useColores } from '../theme/tema';

interface Props {
  onCambiarTienda: () => void;
  onEditarPresupuesto?: () => void;
  /** Versión más pequeña para la pantalla del escáner. */
  compacto?: boolean;
  /** Botones extra a la derecha de la tienda. */
  accesorios?: ReactNode;
}

/** Tienda actual, total grande, número de artículos y presupuesto. Siempre arriba. */
export function ResumenCompra({ onCambiarTienda, onEditarPresupuesto, compacto, accesorios }: Props) {
  const c = useColores();
  const { tiendaActual, total, articulos, sinPrecio, presupuesto } = useCompra();
  const excedido = presupuesto !== null && total > presupuesto;
  const restante = presupuesto !== null ? presupuesto - total : 0;
  const avance = presupuesto ? Math.min(1, total / presupuesto) : 0;

  return (
    <View style={[styles.caja, { backgroundColor: c.tarjeta, borderColor: excedido ? c.peligro : c.borde }]}>
      <View style={styles.tiendaFila}>
      <Pressable
        onPress={onCambiarTienda}
        accessibilityRole="button"
        accessibilityLabel={`Tienda: ${tiendaActual?.nombre ?? 'sin elegir'}. Toca para cambiar.`}
        style={({ pressed }) => [styles.tienda, { backgroundColor: c.tarjetaSuave, opacity: pressed ? 0.7 : 1 }]}
      >
        <Ionicons name="storefront-outline" size={22} color={c.primario} />
        <Text style={[styles.tiendaNombre, { color: c.texto }]} numberOfLines={1}>
          {tiendaActual?.nombre ?? 'Elige tu tienda'}
        </Text>
        <Ionicons name="chevron-down" size={22} color={c.primario} />
      </Pressable>
      {accesorios}
      </View>

      <View style={styles.totalFila}>
        <Text
          style={[styles.total, compacto && styles.totalCompacto, { color: excedido ? c.peligro : c.texto }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          accessibilityLabel={`Total ${formatoDinero(total)}`}
          accessibilityLiveRegion="polite"
          testID="total"
        >
          {formatoDinero(total)}
        </Text>
        <Text style={[styles.articulos, { color: c.textoSuave }]}>{plural(articulos, 'artículo', 'artículos')}</Text>
      </View>

      {sinPrecio > 0 ? (
        <Text style={[styles.sinPrecio, { color: c.aviso }]}>
          {plural(sinPrecio, 'producto', 'productos')} sin precio en esta tienda (no se suman)
        </Text>
      ) : null}

      {presupuesto !== null || onEditarPresupuesto ? (
        <Pressable
          onPress={onEditarPresupuesto}
          disabled={!onEditarPresupuesto}
          accessibilityRole={onEditarPresupuesto ? 'button' : 'text'}
          accessibilityHint={onEditarPresupuesto ? 'Toca para cambiar o quitar el presupuesto' : undefined}
          style={({ pressed }) => [
            styles.presupuesto,
            { backgroundColor: excedido ? c.peligroFondo : c.tarjetaSuave, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="wallet-outline" size={20} color={excedido ? c.peligro : c.textoSuave} />
          {presupuesto === null ? (
            <Text style={[styles.presupuestoTexto, { color: c.textoSuave }]}>Poner presupuesto (opcional)</Text>
          ) : excedido ? (
            <Text style={[styles.presupuestoTexto, styles.fuerte, { color: c.peligro }]}>
              ¡Te pasaste por {formatoDinero(-restante)}! Presupuesto: {formatoDinero(presupuesto)}
            </Text>
          ) : (
            <View style={styles.presupuestoInfo}>
              <Text style={[styles.presupuestoTexto, { color: c.texto }]}>
                Te quedan <Text style={styles.fuerte}>{formatoDinero(restante)}</Text> de {formatoDinero(presupuesto)}
              </Text>
              <View style={[styles.barra, { backgroundColor: c.borde }]}>
                <View
                  style={[
                    styles.barraAvance,
                    { width: `${avance * 100}%`, backgroundColor: avance > 0.9 ? c.aviso : c.primario },
                  ]}
                />
              </View>
            </View>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { borderRadius: 18, borderWidth: 2, padding: espacio.m, gap: espacio.s },
  tiendaFila: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  tienda: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.s,
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: espacio.m,
  },
  tiendaNombre: { flex: 1, fontSize: letra.grande, fontWeight: '800' },
  totalFila: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: espacio.m },
  total: { fontSize: letra.total, fontWeight: '900', flexShrink: 1, fontVariant: ['tabular-nums'] },
  totalCompacto: { fontSize: 36 },
  articulos: { fontSize: letra.normal, fontWeight: '600' },
  sinPrecio: { fontSize: letra.chica, fontWeight: '700' },
  presupuesto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.s,
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: espacio.m,
    paddingVertical: espacio.s,
  },
  presupuestoInfo: { flex: 1, gap: 6 },
  presupuestoTexto: { flex: 1, fontSize: letra.chica + 1 },
  fuerte: { fontWeight: '800' },
  barra: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barraAvance: { height: 6, borderRadius: 3 },
});
