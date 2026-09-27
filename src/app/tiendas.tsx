import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boton } from '../components/Boton';
import { BotonIcono } from '../components/BotonIcono';
import { CampoTexto } from '../components/Campos';
import { Hoja } from '../components/Hoja';
import { Insignia } from '../components/Insignia';
import { useCompra } from '../context/CompraContext';
import { contarPreciosDeTienda } from '../db/tiendas';
import type { Tienda } from '../db/tipos';
import { confirmar, mensajeDeError } from '../lib/dialogos';
import { plural } from '../lib/texto';
import { espacio, letra, useColores } from '../theme/tema';

/** Administrar tiendas: agregar, renombrar y eliminar. */
export default function PantallaTiendas() {
  const c = useColores();
  const insets = useSafeAreaInsets();
  const { db, tiendas, tiendaActual, crearTienda, renombrarTienda, eliminarTienda } = useCompra();
  const [nueva, setNueva] = useState('');
  const [errorNueva, setErrorNueva] = useState<string | null>(null);
  const [editando, setEditando] = useState<Tienda | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [errorEditado, setErrorEditado] = useState<string | null>(null);

  const agregar = async () => {
    try {
      await crearTienda(nueva);
      setNueva('');
      setErrorNueva(null);
    } catch (e) {
      setErrorNueva(mensajeDeError(e));
    }
  };

  const guardarNombre = async () => {
    if (!editando) return;
    try {
      await renombrarTienda(editando.id, nombreEditado);
      setEditando(null);
    } catch (e) {
      setErrorEditado(mensajeDeError(e));
    }
  };

  const eliminar = async (tienda: Tienda) => {
    const precios = await contarPreciosDeTienda(db, tienda.id);
    const ok = await confirmar({
      titulo: `¿Eliminar ${tienda.nombre}?`,
      mensaje:
        precios > 0
          ? `También se borrarán ${plural(precios, 'precio guardado', 'precios guardados')} en esta tienda y su historial. Los productos no se borran.`
          : 'Esta tienda no tiene precios guardados.',
      textoConfirmar: 'Eliminar',
      destructivo: true,
    });
    if (ok) await eliminarTienda(tienda.id);
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.fondo }}
      contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + espacio.xl }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.tarjeta, { backgroundColor: c.tarjeta, borderColor: c.borde }]}>
        <CampoTexto
          etiqueta="Nueva tienda"
          placeholder="Ej. Bodega Aurrera"
          value={nueva}
          onChangeText={(t) => {
            setNueva(t);
            setErrorNueva(null);
          }}
          onSubmitEditing={agregar}
          returnKeyType="done"
          autoCapitalize="words"
          error={errorNueva}
        />
        <Boton titulo="Agregar tienda" icono="add-circle-outline" onPress={agregar} deshabilitado={!nueva.trim()} />
      </View>

      {tiendas.length === 0 ? (
        <Text style={[styles.vacio, { color: c.textoSuave }]}>Aún no tienes tiendas.</Text>
      ) : (
        tiendas.map((t) => (
          <View key={t.id} style={[styles.fila, { backgroundColor: c.tarjeta, borderColor: c.borde }]}>
            <Ionicons name="storefront-outline" size={26} color={c.primario} />
            <View style={styles.flex}>
              <Text style={[styles.nombre, { color: c.texto }]} numberOfLines={2}>
                {t.nombre}
              </Text>
              {t.id === tiendaActual?.id ? <Insignia tipo="info" texto="Estás aquí" /> : null}
            </View>
            <BotonIcono
              icono="create-outline"
              etiqueta={`Renombrar ${t.nombre}`}
              onPress={() => {
                setEditando(t);
                setNombreEditado(t.nombre);
                setErrorEditado(null);
              }}
            />
            <BotonIcono
              icono="trash-outline"
              etiqueta={`Eliminar ${t.nombre}`}
              color={c.peligro}
              onPress={() => eliminar(t)}
            />
          </View>
        ))
      )}

      <Hoja visible={editando !== null} titulo="Renombrar tienda" onCerrar={() => setEditando(null)}>
        <CampoTexto
          etiqueta="Nombre"
          value={nombreEditado}
          onChangeText={(t) => {
            setNombreEditado(t);
            setErrorEditado(null);
          }}
          autoFocus
          onSubmitEditing={guardarNombre}
          returnKeyType="done"
          autoCapitalize="words"
          error={errorEditado}
        />
        <Boton titulo="Guardar" icono="checkmark-circle" onPress={guardarNombre} />
      </Hoja>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: espacio.l, gap: espacio.m },
  tarjeta: { borderWidth: 1.5, borderRadius: 16, padding: espacio.l, gap: espacio.m },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: espacio.m,
    minHeight: 72,
  },
  flex: { flex: 1, gap: 4 },
  nombre: { fontSize: letra.grande, fontWeight: '800' },
  vacio: { fontSize: letra.normal, textAlign: 'center', marginTop: espacio.xl },
});
