import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AvisoFlotante, type Aviso } from '../../components/AvisoFlotante';
import { Boton } from '../../components/Boton';
import { CampoTexto } from '../../components/Campos';
import { FormularioProducto } from '../../components/FormularioProducto';
import { Hoja } from '../../components/Hoja';
import { Insignia } from '../../components/Insignia';
import { useCompra } from '../../context/CompraContext';
import { actualizarPrecio } from '../../db/flujo';
import { historialDeProducto, preciosDeProducto } from '../../db/precios';
import { eliminarProducto, obtenerProducto, renombrarProducto } from '../../db/productos';
import type { PrecioAnterior, PrecioEnTienda, Producto, Tienda } from '../../db/tipos';
import { useFlujoProducto } from '../../hooks/useFlujoProducto';
import { confirmar, mensajeDeError } from '../../lib/dialogos';
import { formatoDinero } from '../../lib/dinero';
import { esPrecioViejo, formatoFecha, haceCuanto } from '../../lib/fechas';
import { espacio, letra, useColores } from '../../theme/tema';

interface Datos {
  producto: Producto;
  precios: PrecioEnTienda[];
  historial: PrecioAnterior[];
}

/** Detalle de un producto: su precio en cada tienda y cómo ha cambiado. */
export default function PantallaProducto() {
  const c = useColores();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productoId = Number(id);
  const { db, tiendas, tiendaActual, recargar } = useCompra();
  const [datos, setDatos] = useState<Datos | null | undefined>(undefined);
  const [editandoTienda, setEditandoTienda] = useState<Tienda | null>(null);
  const [renombrando, setRenombrando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const ocultarAviso = useCallback(() => setAviso(null), []);

  const cargar = useCallback(async () => {
    const producto = await obtenerProducto(db, productoId);
    if (!producto) return setDatos(null);
    const [precios, historial] = await Promise.all([
      preciosDeProducto(db, productoId),
      historialDeProducto(db, productoId),
    ]);
    setDatos({ producto, precios, historial });
  }, [db, productoId]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  // "Al carrito" usa el mismo flujo que el escáner; al terminar, recarga esta pantalla.
  const alAvisar = useCallback(
    (a: Aviso) => {
      setAviso(a);
      cargar();
    },
    [cargar],
  );
  const flujo = useFlujoProducto({ alAvisar, conEnlaceDetalle: false });

  const filas = useMemo(() => {
    if (!datos) return [];
    const minimo = datos.precios.length > 1 ? Math.min(...datos.precios.map((p) => p.centavos)) : null;
    const conPrecio = datos.precios.map((p) => ({
      tienda: { id: p.tiendaId, nombre: p.tiendaNombre },
      precio: p,
      masBarata: minimo !== null && p.centavos === minimo,
      diferencia: minimo !== null ? p.centavos - minimo : 0,
    }));
    const sinPrecio = tiendas
      .filter((t) => !datos.precios.some((p) => p.tiendaId === t.id))
      .map((t) => ({ tienda: t, precio: null, masBarata: false, diferencia: 0 }));
    return [...conPrecio, ...sinPrecio];
  }, [datos, tiendas]);

  const historialPorTienda = useMemo(() => {
    if (!datos) return [];
    return datos.precios
      .map((actual) => {
        // Del más antiguo al actual, para calcular si subió o bajó.
        const anteriores = datos.historial
          .filter((h) => h.tiendaId === actual.tiendaId)
          .sort((a, b) => a.registradoEn.localeCompare(b.registradoEn));
        const secuencia = [...anteriores.map((h) => ({ ...h, actual: false })), { ...actual, id: -1, actual: true }];
        const cambios = secuencia.map((p, i) => ({ ...p, cambio: i === 0 ? 0 : p.centavos - secuencia[i - 1].centavos }));
        return { tienda: actual.tiendaNombre, tiendaId: actual.tiendaId, cambios: cambios.reverse() };
      })
      .filter((g) => g.cambios.length > 1);
  }, [datos]);

  if (datos === undefined) {
    return (
      <View style={[styles.centro, { backgroundColor: c.fondo }]}>
        <ActivityIndicator size="large" color={c.primario} />
      </View>
    );
  }

  if (datos === null) {
    return (
      <View style={[styles.centro, { backgroundColor: c.fondo }]}>
        <Text style={{ color: c.texto, fontSize: letra.normal }}>Este producto ya no existe.</Text>
      </View>
    );
  }

  const { producto } = datos;

  const guardarPrecio = async ({ centavos }: { centavos: number }) => {
    if (!editandoTienda) return;
    const resultado = await actualizarPrecio(db, producto.id, editandoTienda.id, centavos);
    setEditandoTienda(null);
    setAviso({
      id: Date.now(),
      titulo: resultado === 'igual' ? 'Precio confirmado' : 'Precio guardado',
      nombre: `${producto.nombre} en ${editandoTienda.nombre}`,
      centavos,
    });
    await Promise.all([cargar(), recargar()]);
  };

  const guardarNombre = async () => {
    try {
      await renombrarProducto(db, producto.id, nuevoNombre);
      setRenombrando(false);
      await Promise.all([cargar(), recargar()]);
    } catch (e) {
      setErrorNombre(mensajeDeError(e));
    }
  };

  const eliminar = async () => {
    const ok = await confirmar({
      titulo: `¿Eliminar ${producto.nombre}?`,
      mensaje: 'Se borrarán sus precios en todas las tiendas y su historial. Esta acción no se puede deshacer.',
      textoConfirmar: 'Eliminar',
      destructivo: true,
    });
    if (!ok) return;
    await eliminarProducto(db, producto.id);
    await recargar();
    router.back();
  };

  return (
    <View style={[styles.pantalla, { backgroundColor: c.fondo }]}>
      <Stack.Screen options={{ title: producto.nombre }} />
      <ScrollView contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + espacio.xl }]}>
        <View style={[styles.tarjeta, { backgroundColor: c.tarjeta, borderColor: c.borde }]}>
          <Text style={[styles.nombre, { color: c.texto }]}>{producto.nombre}</Text>
          <Text style={[styles.codigo, { color: c.textoSuave }]}>
            {producto.codigo ? `Código ${producto.codigo}` : 'Producto sin código'}
          </Text>
          <View style={styles.botones}>
            <Boton
              titulo="Renombrar"
              variante="suave"
              onPress={() => {
                setNuevoNombre(producto.nombre);
                setErrorNombre(null);
                setRenombrando(true);
              }}
              style={styles.flex}
            />
            {tiendaActual ? (
              <Boton
                titulo="Al carrito"
                icono="cart-outline"
                onPress={() => flujo.agregarProducto(producto)}
                style={styles.flex}
              />
            ) : null}
          </View>
        </View>

        <Text style={[styles.seccion, { color: c.texto }]} accessibilityRole="header">
          Precio por tienda
        </Text>
        <Text style={[styles.ayuda, { color: c.textoSuave }]}>Toca una tienda para registrar o corregir su precio.</Text>
        {filas.map(({ tienda, precio, masBarata, diferencia }) => (
          <Pressable
            key={tienda.id}
            onPress={() => setEditandoTienda(tienda)}
            accessibilityRole="button"
            accessibilityLabel={`${tienda.nombre}: ${precio ? formatoDinero(precio.centavos) : 'sin precio'}`}
            style={({ pressed }) => [
              styles.precioFila,
              {
                backgroundColor: c.tarjeta,
                borderColor: masBarata ? c.exito : c.borde,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View style={styles.flex}>
              <Text style={[styles.tienda, { color: c.texto }]} numberOfLines={1}>
                {tienda.nombre}
              </Text>
              {precio ? (
                <Text style={[styles.fecha, { color: c.textoSuave }]}>
                  {formatoFecha(precio.registradoEn)} · {haceCuanto(precio.registradoEn)}
                </Text>
              ) : (
                <Text style={[styles.fecha, { color: c.textoSuave }]}>Toca para agregar su precio</Text>
              )}
              <View style={styles.insignias}>
                {masBarata ? <Insignia tipo="barata" texto="Más barata" /> : null}
                {precio && esPrecioViejo(precio.registradoEn) ? <Insignia tipo="vieja" texto="Precio viejo" /> : null}
                {tienda.id === tiendaActual?.id ? <Insignia tipo="info" texto="Estás aquí" /> : null}
              </View>
            </View>
            <View style={styles.precioCol}>
              <Text style={[styles.precio, { color: precio ? (masBarata ? c.exito : c.texto) : c.textoSuave }]}>
                {precio ? formatoDinero(precio.centavos) : 'Sin precio'}
              </Text>
              {diferencia > 0 ? (
                <Text style={[styles.diferencia, { color: c.peligro }]}>+{formatoDinero(diferencia)}</Text>
              ) : null}
            </View>
          </Pressable>
        ))}

        <Text style={[styles.seccion, { color: c.texto }]} accessibilityRole="header">
          Historial de precios
        </Text>
        {historialPorTienda.length === 0 ? (
          <Text style={[styles.ayuda, { color: c.textoSuave }]}>
            Aún no hay cambios de precio. Cuando cambies un precio, el anterior se guarda aquí con su fecha.
          </Text>
        ) : (
          historialPorTienda.map((grupo) => (
            <View key={grupo.tiendaId} style={[styles.tarjeta, { backgroundColor: c.tarjeta, borderColor: c.borde }]}>
              <Text style={[styles.tienda, { color: c.texto }]}>{grupo.tienda}</Text>
              {grupo.cambios.map((p) => (
                <View key={p.id} style={styles.historialFila}>
                  <Text style={[styles.historialFecha, { color: c.textoSuave }]}>
                    {formatoFecha(p.registradoEn)}
                    {p.actual ? ' (actual)' : ''}
                  </Text>
                  <Text style={[styles.historialPrecio, { color: c.texto }]}>{formatoDinero(p.centavos)}</Text>
                  <View style={styles.cambio}>
                    {p.cambio !== 0 ? (
                      <>
                        <Ionicons
                          name={p.cambio > 0 ? 'arrow-up' : 'arrow-down'}
                          size={16}
                          color={p.cambio > 0 ? c.peligro : c.exito}
                        />
                        <Text style={[styles.cambioTexto, { color: p.cambio > 0 ? c.peligro : c.exito }]}>
                          {p.cambio > 0 ? 'Subió ' : 'Bajó '}
                          {formatoDinero(Math.abs(p.cambio))}
                        </Text>
                      </>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ))
        )}

        <Boton titulo="Eliminar producto" icono="trash-outline" variante="peligro" onPress={eliminar} style={styles.eliminar} />
      </ScrollView>

      {aviso ? (
        <View style={[styles.avisoCaja, { bottom: insets.bottom + espacio.l }]}>
          <AvisoFlotante aviso={aviso} onOcultar={ocultarAviso} />
        </View>
      ) : null}

      {editandoTienda ? (
        <FormularioProducto
          key={editandoTienda.id}
          modo={{
            tipo: 'precio',
            producto,
            referencias: datos.precios.filter((p) => p.tiendaId !== editandoTienda.id),
            precioActual: datos.precios.find((p) => p.tiendaId === editandoTienda.id)?.centavos ?? null,
          }}
          tiendaNombre={editandoTienda.nombre}
          textoGuardar="Guardar precio"
          onGuardar={guardarPrecio}
          onCerrar={() => setEditandoTienda(null)}
        />
      ) : null}

      {flujo.formulario}

      <Hoja visible={renombrando} titulo="Cambiar nombre" onCerrar={() => setRenombrando(false)}>
        <CampoTexto
          etiqueta="Nombre del producto"
          value={nuevoNombre}
          onChangeText={(t) => {
            setNuevoNombre(t);
            setErrorNombre(null);
          }}
          autoFocus
          onSubmitEditing={guardarNombre}
          returnKeyType="done"
          error={errorNombre}
        />
        <Boton titulo="Guardar nombre" icono="checkmark-circle" onPress={guardarNombre} />
      </Hoja>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espacio.xl },
  contenido: { padding: espacio.l, gap: espacio.m },
  flex: { flex: 1 },
  tarjeta: { borderWidth: 1.5, borderRadius: 16, padding: espacio.l, gap: espacio.s },
  nombre: { fontSize: letra.titulo, fontWeight: '900' },
  codigo: { fontSize: letra.chica + 1 },
  botones: { flexDirection: 'row', gap: espacio.s, marginTop: espacio.s },
  seccion: { fontSize: letra.grande, fontWeight: '800', marginTop: espacio.m },
  ayuda: { fontSize: letra.chica },
  precioFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    borderWidth: 2,
    borderRadius: 16,
    padding: espacio.m,
    minHeight: 72,
  },
  tienda: { fontSize: letra.normal, fontWeight: '800' },
  fecha: { fontSize: letra.chica },
  insignias: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.xs, marginTop: 4 },
  precioCol: { alignItems: 'flex-end' },
  precio: { fontSize: letra.grande, fontWeight: '900', fontVariant: ['tabular-nums'] },
  diferencia: { fontSize: letra.chica, fontWeight: '700' },
  historialFila: { flexDirection: 'row', alignItems: 'center', gap: espacio.s, minHeight: 32 },
  historialFecha: { flex: 1, fontSize: letra.chica },
  historialPrecio: { fontSize: letra.normal, fontWeight: '700', fontVariant: ['tabular-nums'] },
  cambio: { width: 118, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  cambioTexto: { fontSize: letra.chica, fontWeight: '700' },
  eliminar: { marginTop: espacio.xl },
  avisoCaja: { position: 'absolute', left: espacio.l, right: espacio.l, pointerEvents: 'none' },
});
