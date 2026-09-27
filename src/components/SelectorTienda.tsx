import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCompra } from '../context/CompraContext';
import type { Tienda } from '../db/tipos';
import { confirmar, mensajeDeError } from '../lib/dialogos';
import { plural } from '../lib/texto';
import { espacio, letra, useColores } from '../theme/tema';
import { Boton } from './Boton';
import { CampoTexto } from './Campos';
import { Hoja } from './Hoja';

interface Props {
  visible: boolean;
  onCerrar: () => void;
}

/** Ventana para elegir en qué tienda estás (o agregar una nueva). */
export function SelectorTienda({ visible, onCerrar }: Props) {
  const c = useColores();
  const router = useRouter();
  const { tiendas, tiendaActual, items, elegirTienda, crearTienda } = useCompra();
  const [nueva, setNueva] = useState('');
  const [error, setError] = useState<string | null>(null);

  const elegir = async (tienda: Tienda) => {
    if (tienda.id === tiendaActual?.id) return onCerrar();
    if (items.length > 0 && tiendaActual) {
      const ok = await confirmar({
        titulo: `¿Cambiar a ${tienda.nombre}?`,
        mensaje: `Tu carrito tiene ${plural(items.length, 'producto', 'productos')}. Se usarán los precios de ${tienda.nombre}; los que no tengan precio ahí quedarán marcados para que los captures.`,
        textoConfirmar: 'Cambiar',
      });
      if (!ok) return;
    }
    await elegirTienda(tienda.id);
    onCerrar();
  };

  const agregar = async () => {
    try {
      const id = await crearTienda(nueva);
      setNueva('');
      setError(null);
      await elegir({ id, nombre: nueva.trim() });
    } catch (e) {
      setError(mensajeDeError(e));
    }
  };

  return (
    <Hoja visible={visible} titulo="¿En qué tienda estás?" onCerrar={onCerrar}>
      {tiendas.map((t) => {
        const actual = t.id === tiendaActual?.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => elegir(t)}
            accessibilityRole="button"
            accessibilityState={{ selected: actual }}
            style={({ pressed }) => [
              styles.opcion,
              {
                backgroundColor: actual ? c.exitoFondo : c.tarjetaSuave,
                borderColor: actual ? c.primario : 'transparent',
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name="storefront-outline" size={24} color={actual ? c.primario : c.textoSuave} />
            <Text style={[styles.nombre, { color: c.texto }]} numberOfLines={1}>
              {t.nombre}
            </Text>
            {actual ? <Ionicons name="checkmark-circle" size={26} color={c.primario} /> : null}
          </Pressable>
        );
      })}

      <View style={[styles.separador, { backgroundColor: c.borde }]} />
      <CampoTexto
        etiqueta="Agregar otra tienda"
        placeholder="Ej. Chedraui"
        value={nueva}
        onChangeText={(t) => {
          setNueva(t);
          setError(null);
        }}
        onSubmitEditing={agregar}
        returnKeyType="done"
        autoCapitalize="words"
        error={error}
      />
      <Boton titulo="Agregar y elegir" icono="add-circle-outline" variante="secundario" onPress={agregar} deshabilitado={!nueva.trim()} />
      <Boton
        titulo="Administrar tiendas"
        icono="settings-outline"
        variante="suave"
        onPress={() => {
          onCerrar();
          router.push('/tiendas');
        }}
      />
    </Hoja>
  );
}

const styles = StyleSheet.create({
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    minHeight: 60,
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: espacio.l,
  },
  nombre: { flex: 1, fontSize: letra.grande, fontWeight: '700' },
  separador: { height: 1, marginVertical: espacio.xs },
});
