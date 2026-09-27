import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AvisoFlotante, type Aviso } from '../components/AvisoFlotante';
import { Boton } from '../components/Boton';
import { BotonAccion } from '../components/BotonAccion';
import { BotonIcono } from '../components/BotonIcono';
import { FilaCarrito } from '../components/FilaCarrito';
import { InicioCompra } from '../components/InicioCompra';
import { ModalCodigo } from '../components/ModalCodigo';
import { ModalPresupuesto } from '../components/ModalPresupuesto';
import { ResumenCompra } from '../components/ResumenCompra';
import { SelectorTienda } from '../components/SelectorTienda';
import { useCompra } from '../context/CompraContext';
import type { ItemCarrito } from '../db/tipos';
import { useFlujoProducto } from '../hooks/useFlujoProducto';
import { confirmar } from '../lib/dialogos';
import { formatoDinero } from '../lib/dinero';
import { plural } from '../lib/texto';
import { espacio, letra, useColores } from '../theme/tema';

/** Pantalla principal: la compra en curso. */
export default function PantallaCompra() {
  const c = useColores();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const compra = useCompra();
  const { items, total, articulos, cambiarCantidad, quitar, terminarCompra } = compra;
  const [verSelector, setVerSelector] = useState(false);
  const [verPresupuesto, setVerPresupuesto] = useState(false);
  const [verCodigo, setVerCodigo] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [altoBarra, setAltoBarra] = useState(180);
  const flujo = useFlujoProducto({ alAvisar: setAviso });
  const ocultarAviso = useCallback(() => setAviso(null), []);

  const alCambiarCantidad = useCallback(
    (item: ItemCarrito, cantidad: number) => {
      if (cantidad >= 1) cambiarCantidad(item.id, cantidad);
    },
    [cambiarCantidad],
  );

  const alQuitar = useCallback(
    async (item: ItemCarrito) => {
      const ok = await confirmar({
        titulo: `¿Quitar ${item.nombre}?`,
        mensaje: 'Se quita del carrito. Su precio guardado no se borra.',
        textoConfirmar: 'Quitar',
        destructivo: true,
      });
      if (ok) quitar(item.id);
    },
    [quitar],
  );

  const alTerminar = async () => {
    const ok = await confirmar({
      titulo: '¿Terminar compra?',
      mensaje: `Total: ${formatoDinero(total)} (${plural(articulos, 'artículo', 'artículos')}).\n\nSe vaciará el carrito. Los precios guardados se conservan para tus próximas compras.`,
      textoConfirmar: 'Terminar',
      destructivo: true,
    });
    if (!ok) return;
    setAviso(null);
    await terminarCompra();
  };

  if (!compra.listo) {
    return (
      <View style={[styles.centro, { backgroundColor: c.fondo }]}>
        <ActivityIndicator size="large" color={c.primario} />
      </View>
    );
  }

  if (!compra.tiendaActual) return <InicioCompra />;

  return (
    <View style={[styles.pantalla, { backgroundColor: c.fondo, paddingTop: insets.top + espacio.s }]}>
      <View style={styles.resumen}>
        <ResumenCompra
          onCambiarTienda={() => setVerSelector(true)}
          onEditarPresupuesto={() => setVerPresupuesto(true)}
          accesorios={
            <BotonIcono
              icono="pricetag-outline"
              etiqueta="Mis productos"
              texto="Productos"
              tamano={22}
              onPress={() => router.push('/productos')}
            />
          }
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <FilaCarrito item={item} onEditar={flujo.editarPrecio} onCantidad={alCambiarCantidad} onQuitar={alQuitar} />
        )}
        contentContainerStyle={styles.lista}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Ionicons name="barcode-outline" size={64} color={c.textoSuave} />
            <Text style={[styles.vacioTitulo, { color: c.texto }]}>Tu carrito está vacío</Text>
            <Text style={[styles.vacioTexto, { color: c.textoSuave }]}>
              Toca «Escanear» y apunta al código de barras de cada producto que metas al carrito.
            </Text>
          </View>
        }
        ListFooterComponent={
          items.length > 0 ? (
            <Boton titulo="Terminar compra" icono="bag-check-outline" variante="peligro" onPress={alTerminar} style={styles.terminar} />
          ) : null
        }
      />

      {aviso ? (
        <View style={[styles.avisoCaja, { bottom: altoBarra + espacio.s }]}>
          <AvisoFlotante aviso={aviso} onOcultar={ocultarAviso} />
        </View>
      ) : null}

      <View
        onLayout={(e) => setAltoBarra(e.nativeEvent.layout.height)}
        style={[
          styles.barraInferior,
          { backgroundColor: c.tarjeta, borderColor: c.borde, paddingBottom: insets.bottom + espacio.m },
        ]}
      >
        <Boton titulo="Escanear" icono="barcode-outline" grande onPress={() => router.push('/escanear')} />
        <View style={styles.acciones}>
          <BotonAccion titulo="Sin código" icono="nutrition-outline" onPress={flujo.agregarSinCodigo} />
          <BotonAccion titulo="Escribir código" icono="keypad-outline" onPress={() => setVerCodigo(true)} />
          <BotonAccion
            titulo="Comparar tiendas"
            icono="swap-horizontal"
            onPress={() => router.push('/comparar')}
            deshabilitado={items.length === 0}
          />
        </View>
      </View>

      {flujo.formulario}
      <SelectorTienda visible={verSelector} onCerrar={() => setVerSelector(false)} />
      <ModalPresupuesto visible={verPresupuesto} onCerrar={() => setVerPresupuesto(false)} />
      <ModalCodigo
        visible={verCodigo}
        onCerrar={() => setVerCodigo(false)}
        onBuscar={(codigo) => {
          setVerCodigo(false);
          flujo.procesarCodigo(codigo);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  resumen: { paddingHorizontal: espacio.l },
  lista: { padding: espacio.l, gap: espacio.s, flexGrow: 1 },
  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espacio.s, paddingVertical: espacio.xl },
  vacioTitulo: { fontSize: letra.grande, fontWeight: '800' },
  vacioTexto: { fontSize: letra.normal, textAlign: 'center', maxWidth: 320 },
  terminar: { marginTop: espacio.m },
  avisoCaja: { position: 'absolute', left: espacio.l, right: espacio.l, pointerEvents: 'none' },
  barraInferior: {
    borderTopWidth: 1,
    paddingHorizontal: espacio.l,
    paddingTop: espacio.m,
    gap: espacio.s,
  },
  acciones: { flexDirection: 'row', gap: espacio.s },
});
