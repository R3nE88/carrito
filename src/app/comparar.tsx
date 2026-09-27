import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Insignia } from '../components/Insignia';
import { useCompra } from '../context/CompraContext';
import { datosComparacion } from '../db/carrito';
import { calcularComparacion, type ItemAComparar, type PrecioAComparar } from '../lib/comparacion';
import { formatoDinero } from '../lib/dinero';
import { plural } from '../lib/texto';
import { espacio, letra, useColores } from '../theme/tema';

/** Cuánto costaría el carrito actual en cada tienda. */
export default function PantallaComparar() {
  const c = useColores();
  const insets = useSafeAreaInsets();
  const { db, tiendas, tiendaActual } = useCompra();
  const [datos, setDatos] = useState<{ items: ItemAComparar[]; precios: PrecioAComparar[] } | null>(null);
  const [soloEnComun, setSoloEnComun] = useState(false);

  useFocusEffect(
    useCallback(() => {
      datosComparacion(db).then(setDatos);
    }, [db]),
  );

  const resultado = useMemo(
    () => (datos ? calcularComparacion(tiendas, datos.items, datos.precios, { soloEnComun }) : null),
    [datos, tiendas, soloEnComun],
  );

  if (!resultado) return <View style={[styles.flex, { backgroundColor: c.fondo }]} />;

  if (resultado.productosEnCarrito === 0) {
    return (
      <View style={[styles.vacio, { backgroundColor: c.fondo }]}>
        <Ionicons name="cart-outline" size={64} color={c.textoSuave} />
        <Text style={[styles.vacioTexto, { color: c.texto }]}>Agrega productos al carrito para comparar.</Text>
      </View>
    );
  }

  const actual = resultado.tiendas.find((t) => t.tiendaId === tiendaActual?.id);
  const barata = resultado.tiendas.find((t) => t.masBarata);
  const ahorro =
    actual && barata && actual.completa && barata.tiendaId !== actual.tiendaId ? actual.total - barata.total : 0;
  const ninguna = !resultado.tiendas.some((t) => t.completa);

  return (
    <ScrollView
      style={{ backgroundColor: c.fondo }}
      contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + espacio.xl }]}
    >
      <Text style={[styles.intro, { color: c.textoSuave }]}>
        {soloEnComun
          ? `Comparando solo los ${plural(resultado.productosComparados, 'producto', 'productos')} con precio en todas las tiendas.`
          : `Tu carrito tiene ${plural(resultado.productosEnCarrito, 'producto', 'productos')} distintos. Cada tienda suma solo los que tienen precio registrado ahí.`}
      </Text>

      <View style={[styles.opcion, { backgroundColor: c.tarjeta, borderColor: c.borde }]}>
        <View style={styles.flex}>
          <Text style={[styles.opcionTitulo, { color: c.texto }]}>Solo productos en común</Text>
          <Text style={[styles.opcionTexto, { color: c.textoSuave }]}>
            {resultado.productosEnComun === 0
              ? 'Ningún producto tiene precio en todas las tiendas.'
              : `Compara parejo: ${plural(resultado.productosEnComun, 'producto tiene', 'productos tienen')} precio en todas.`}
          </Text>
        </View>
        <Switch
          value={soloEnComun}
          onValueChange={setSoloEnComun}
          disabled={resultado.productosEnComun === 0 && !soloEnComun}
          trackColor={{ true: c.primario }}
          accessibilityLabel="Comparar solo productos con precio en todas las tiendas"
        />
      </View>

      {ahorro > 0 && barata ? (
        <View style={[styles.ahorro, { backgroundColor: c.exitoFondo }]}>
          <Ionicons name="trending-down" size={24} color={c.exito} />
          <Text style={[styles.ahorroTexto, { color: c.exito }]}>
            En {barata.nombre} ahorrarías {formatoDinero(ahorro)} comparado con {actual?.nombre}.
          </Text>
        </View>
      ) : null}

      {ninguna ? (
        <View style={[styles.ahorro, { backgroundColor: c.avisoFondo }]}>
          <Ionicons name="alert-circle" size={24} color={c.aviso} />
          <Text style={[styles.ahorroTexto, { color: c.aviso }]}>
            Ninguna tienda tiene precio de todos los productos, así que los totales no son comparables del todo.
            {resultado.productosEnComun > 0 && !soloEnComun ? ' Activa «Solo productos en común» para comparar parejo.' : ''}
          </Text>
        </View>
      ) : null}

      {resultado.tiendas.map((t) => {
        const esActual = t.tiendaId === tiendaActual?.id;
        return (
          <View
            key={t.tiendaId}
            style={[
              styles.tarjeta,
              { backgroundColor: c.tarjeta, borderColor: t.masBarata ? c.primario : c.borde },
            ]}
            accessibilityLabel={`${t.nombre}: ${formatoDinero(t.total)}${t.faltantes.length ? `, faltan ${t.faltantes.length} precios` : ''}`}
          >
            <View style={styles.fila}>
              <Text style={[styles.tienda, { color: c.texto }]} numberOfLines={1}>
                {t.nombre}
              </Text>
              <Text style={[styles.total, { color: t.masBarata ? c.exito : c.texto }]}>{formatoDinero(t.total)}</Text>
            </View>
            <View style={styles.insignias}>
              {t.masBarata ? <Insignia tipo="barata" texto="Más barata" /> : null}
              {esActual ? <Insignia tipo="info" texto="Estás aquí" /> : null}
              {t.completa ? (
                <Insignia tipo="ok" texto="Todos los precios" />
              ) : (
                <Insignia
                  tipo="aviso"
                  texto={`${plural(t.faltantes.length, 'producto', 'productos')} sin precio`}
                />
              )}
              {t.preciosViejos > 0 ? (
                <Insignia tipo="vieja" texto={`${plural(t.preciosViejos, 'precio viejo', 'precios viejos')}`} />
              ) : null}
            </View>
            {t.faltantes.length > 0 ? (
              <Text style={[styles.faltan, { color: c.textoSuave }]}>
                Sin precio: {t.faltantes.join(', ')}. El total no los incluye.
              </Text>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  contenido: { padding: espacio.l, gap: espacio.m },
  intro: { fontSize: letra.chica + 1 },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: espacio.m,
  },
  opcionTitulo: { fontSize: letra.normal, fontWeight: '700' },
  opcionTexto: { fontSize: letra.chica },
  ahorro: { flexDirection: 'row', alignItems: 'center', gap: espacio.m, borderRadius: 14, padding: espacio.m },
  ahorroTexto: { flex: 1, fontSize: letra.normal, fontWeight: '700' },
  tarjeta: { borderWidth: 2, borderRadius: 16, padding: espacio.l, gap: espacio.s },
  fila: { flexDirection: 'row', alignItems: 'baseline', gap: espacio.m },
  tienda: { flex: 1, fontSize: letra.grande, fontWeight: '800' },
  total: { fontSize: letra.titulo, fontWeight: '900', fontVariant: ['tabular-nums'] },
  insignias: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  faltan: { fontSize: letra.chica },
  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espacio.m, padding: espacio.xl },
  vacioTexto: { fontSize: letra.normal, textAlign: 'center' },
});
