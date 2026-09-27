import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCompra } from '../context/CompraContext';
import { mensajeDeError } from '../lib/dialogos';
import { plural } from '../lib/texto';
import { espacio, letra, useColores } from '../theme/tema';
import { Boton } from './Boton';
import { CampoTexto } from './Campos';

const SUGERENCIAS = ['Walmart', 'Bodega Aurrera', 'Soriana', 'Chedraui', 'La Comer', 'Mercado'];

/**
 * Pantalla de inicio cuando aún no hay tienda elegida:
 * - Si no hay tiendas, pide crear la primera.
 * - Si hay tiendas, pregunta en cuál estás para empezar la compra.
 */
export function InicioCompra() {
  const c = useColores();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tiendas, items, crearTienda, elegirTienda } = useCompra();
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState<string | null>(null);
  const sinTiendas = tiendas.length === 0;

  const agregar = async (texto: string) => {
    try {
      await crearTienda(texto);
      setNombre('');
      setError(null);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  };

  const sugerenciasLibres = SUGERENCIAS.filter(
    (s) => !tiendas.some((t) => t.nombre.toLowerCase() === s.toLowerCase()),
  );

  return (
    <ScrollView
      style={{ backgroundColor: c.fondo }}
      contentContainerStyle={[styles.contenido, { paddingTop: insets.top + espacio.xl, paddingBottom: insets.bottom + espacio.xl }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.encabezado}>
        <Ionicons name="cart" size={56} color={c.primario} />
        <Text style={[styles.titulo, { color: c.texto }]} accessibilityRole="header">
          {sinTiendas ? '¡Bienvenido a Carrito!' : '¿En qué tienda estás?'}
        </Text>
        <Text style={[styles.texto, { color: c.textoSuave }]}>
          {sinTiendas
            ? 'Primero agrega las tiendas donde sueles comprar. Cada una guarda sus propios precios.'
            : 'Elige la tienda para empezar tu compra.'}
        </Text>
        {!sinTiendas && items.length > 0 ? (
          <Text style={[styles.texto, { color: c.aviso }]}>
            Tu carrito tiene {plural(items.length, 'producto', 'productos')} guardados.
          </Text>
        ) : null}
      </View>

      {tiendas.map((t) => (
        <Pressable
          key={t.id}
          onPress={() => elegirTienda(t.id)}
          accessibilityRole="button"
          accessibilityLabel={`Estoy en ${t.nombre}`}
          style={({ pressed }) => [
            styles.tienda,
            { backgroundColor: c.tarjeta, borderColor: c.borde, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="storefront-outline" size={28} color={c.primario} />
          <Text style={[styles.tiendaNombre, { color: c.texto }]} numberOfLines={1}>
            {t.nombre}
          </Text>
          <Ionicons name="chevron-forward" size={24} color={c.textoSuave} />
        </Pressable>
      ))}

      <View style={[styles.caja, { backgroundColor: c.tarjeta, borderColor: c.borde }]}>
        <CampoTexto
          etiqueta={sinTiendas ? 'Nombre de la tienda' : 'Agregar otra tienda'}
          placeholder="Ej. Walmart"
          value={nombre}
          onChangeText={(t) => {
            setNombre(t);
            setError(null);
          }}
          onSubmitEditing={() => agregar(nombre)}
          returnKeyType="done"
          autoCapitalize="words"
          error={error}
        />
        <Boton titulo="Agregar tienda" icono="add-circle-outline" onPress={() => agregar(nombre)} deshabilitado={!nombre.trim()} />
        {sugerenciasLibres.length > 0 ? (
          <>
            <Text style={[styles.sugerenciasTitulo, { color: c.textoSuave }]}>O toca para agregar rápido:</Text>
            <View style={styles.sugerencias}>
              {sugerenciasLibres.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => agregar(s)}
                  accessibilityRole="button"
                  accessibilityLabel={`Agregar ${s}`}
                  style={({ pressed }) => [styles.chip, { backgroundColor: c.tarjetaSuave, opacity: pressed ? 0.7 : 1 }]}
                >
                  <Ionicons name="add" size={18} color={c.primario} />
                  <Text style={[styles.chipTexto, { color: c.texto }]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.enlaces}>
        <Boton titulo="Productos" icono="pricetag-outline" variante="suave" onPress={() => router.push('/productos')} style={styles.flex} />
        {!sinTiendas ? (
          <Boton titulo="Tiendas" icono="settings-outline" variante="suave" onPress={() => router.push('/tiendas')} style={styles.flex} />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: espacio.l, gap: espacio.m },
  encabezado: { alignItems: 'center', gap: espacio.s, marginBottom: espacio.m },
  titulo: { fontSize: letra.titulo, fontWeight: '900', textAlign: 'center' },
  texto: { fontSize: letra.normal, textAlign: 'center' },
  tienda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    minHeight: 68,
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: espacio.l,
  },
  tiendaNombre: { flex: 1, fontSize: letra.grande, fontWeight: '800' },
  caja: { borderRadius: 16, borderWidth: 1.5, padding: espacio.l, gap: espacio.m },
  sugerenciasTitulo: { fontSize: letra.chica, fontWeight: '700' },
  sugerencias: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: espacio.m,
    borderRadius: 999,
  },
  chipTexto: { fontSize: letra.chica + 1, fontWeight: '700' },
  enlaces: { flexDirection: 'row', gap: espacio.s },
  flex: { flex: 1 },
});
