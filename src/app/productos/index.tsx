import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useIsFocused, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCompra } from '../../context/CompraContext';
import { listarProductos } from '../../db/productos';
import type { ProductoResumen } from '../../db/tipos';
import { formatoDinero } from '../../lib/dinero';
import { plural } from '../../lib/texto';
import { espacio, letra, useColores } from '../../theme/tema';

/** Todos los productos guardados, con buscador. */
export default function PantallaProductos() {
  const c = useColores();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const enfocada = useIsFocused();
  const { db, tiendas } = useCompra();
  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState<ProductoResumen[] | null>(null);

  const cargar = useCallback(async (texto: string) => {
    setProductos(await listarProductos(db, texto));
  }, [db]);

  // Busca mientras escribes (con una pequeña pausa) y recarga al volver a esta pantalla.
  useEffect(() => {
    if (!enfocada) return;
    const t = setTimeout(() => cargar(busqueda), 150);
    return () => clearTimeout(t);
  }, [busqueda, cargar, enfocada]);

  return (
    <View style={[styles.pantalla, { backgroundColor: c.fondo }]}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/tiendas')}
              accessibilityRole="button"
              accessibilityLabel="Mis tiendas"
              hitSlop={10}
              style={styles.encabezadoBoton}
            >
              <Ionicons name="storefront-outline" size={22} color={c.primario} />
              <Text style={[styles.encabezadoTexto, { color: c.primario }]}>Tiendas</Text>
            </Pressable>
          ),
        }}
      />
      <View style={[styles.buscador, { backgroundColor: c.tarjeta, borderColor: c.borde }]}>
        <Ionicons name="search" size={22} color={c.textoSuave} />
        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar por nombre o código"
          placeholderTextColor={c.textoSuave}
          style={[styles.buscadorCampo, { color: c.texto }]}
          accessibilityLabel="Buscar producto"
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={productos ?? []}
        keyExtractor={(p) => String(p.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.lista, { paddingBottom: insets.bottom + espacio.xl }]}
        ListEmptyComponent={
          productos ? (
            <View style={styles.vacio}>
              <Ionicons name="pricetag-outline" size={56} color={c.textoSuave} />
              <Text style={[styles.vacioTexto, { color: c.textoSuave }]}>
                {busqueda
                  ? 'No hay productos que coincidan.'
                  : 'Aún no tienes productos. Se guardan solos cuando los escaneas o agregas.'}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/productos/${item.id}`)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.fila,
              { backgroundColor: c.tarjeta, borderColor: c.borde, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={styles.flex}>
              <Text style={[styles.nombre, { color: c.texto }]} numberOfLines={2}>
                {item.nombre}
              </Text>
              <Text style={[styles.detalle, { color: c.textoSuave }]}>
                {item.codigo ?? 'Sin código'} · precio en {item.tiendasConPrecio} de{' '}
                {plural(tiendas.length, 'tienda', 'tiendas')}
              </Text>
              {item.minCentavos !== null ? (
                <Text style={[styles.barato, { color: c.exito }]}>
                  {item.tiendasConPrecio > 1 ? 'Más barato: ' : ''}
                  {formatoDinero(item.minCentavos)} en {item.minTienda}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={22} color={c.textoSuave} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  encabezadoBoton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4, minHeight: 44 },
  encabezadoTexto: { fontSize: letra.normal, fontWeight: '700' },
  flex: { flex: 1, gap: 2 },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.s,
    margin: espacio.l,
    marginBottom: espacio.s,
    paddingHorizontal: espacio.m,
    borderWidth: 2,
    borderRadius: 14,
    minHeight: espacio.botonAlto,
  },
  buscadorCampo: { flex: 1, fontSize: letra.normal, paddingVertical: espacio.s },
  lista: { padding: espacio.l, paddingTop: espacio.s, gap: espacio.s, flexGrow: 1 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    padding: espacio.m,
    borderWidth: 1.5,
    borderRadius: 14,
    minHeight: 72,
  },
  nombre: { fontSize: letra.normal, fontWeight: '700' },
  detalle: { fontSize: letra.chica },
  barato: { fontSize: letra.chica, fontWeight: '700' },
  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espacio.m, padding: espacio.xl },
  vacioTexto: { fontSize: letra.normal, textAlign: 'center' },
});
