import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ItemCarrito } from '../db/tipos';
import { formatoDinero } from '../lib/dinero';
import { esPrecioViejo } from '../lib/fechas';
import { espacio, letra, useColores } from '../theme/tema';
import { BotonIcono } from './BotonIcono';
import { Insignia } from './Insignia';

interface Props {
  item: ItemCarrito;
  onEditar: (item: ItemCarrito) => void;
  onCantidad: (item: ItemCarrito, cantidad: number) => void;
  onQuitar: (item: ItemCarrito) => void;
}

/** Un producto del carrito: nombre, precio, cantidad (+ y −) y botón para quitarlo. */
export const FilaCarrito = memo(function FilaCarrito({ item, onEditar, onCantidad, onQuitar }: Props) {
  const c = useColores();
  const tienePrecio = item.centavos !== null;

  return (
    <View style={[styles.fila, { backgroundColor: c.tarjeta, borderColor: tienePrecio ? c.borde : c.aviso }]}>
      <Pressable
        onPress={() => onEditar(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.nombre}, ${tienePrecio ? formatoDinero(item.centavos!) : 'sin precio'}`}
        accessibilityHint="Toca para corregir el precio"
        style={({ pressed }) => [styles.info, { opacity: pressed ? 0.6 : 1 }]}
      >
        <View style={styles.nombreFila}>
          <Text style={[styles.nombre, { color: c.texto }]} numberOfLines={2}>
            {item.nombre}
          </Text>
          {tienePrecio ? (
            <Text style={[styles.subtotal, { color: c.texto }]}>{formatoDinero(item.centavos! * item.cantidad)}</Text>
          ) : null}
        </View>
        <View style={styles.detalles}>
          {tienePrecio ? (
            <Text style={[styles.precio, { color: c.textoSuave }]}>
              {formatoDinero(item.centavos!)} c/u · <Text style={{ color: c.primario }}>corregir</Text>
            </Text>
          ) : (
            <Insignia tipo="aviso" texto="Sin precio aquí · toca para agregarlo" />
          )}
          {item.registradoEn && esPrecioViejo(item.registradoEn) ? (
            <Insignia tipo="vieja" texto="Precio viejo" />
          ) : null}
        </View>
      </Pressable>

      <View style={styles.controles}>
        <BotonIcono
          icono="trash-outline"
          etiqueta={`Quitar ${item.nombre}`}
          color={c.peligro}
          onPress={() => onQuitar(item)}
        />
        <View style={styles.espaciador} />
        <BotonIcono
          icono="remove"
          etiqueta="Quitar uno"
          onPress={() => onCantidad(item, item.cantidad - 1)}
          deshabilitado={item.cantidad <= 1}
        />
        <Text style={[styles.cantidad, { color: c.texto }]} accessibilityLabel={`Cantidad ${item.cantidad}`}>
          {item.cantidad}
        </Text>
        <BotonIcono icono="add" etiqueta="Agregar uno" onPress={() => onCantidad(item, item.cantidad + 1)} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  fila: { borderRadius: 16, borderWidth: 1.5, padding: espacio.m, gap: espacio.s },
  info: { gap: 6 },
  nombreFila: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.m },
  nombre: { flex: 1, fontSize: letra.normal, fontWeight: '700' },
  subtotal: { fontSize: letra.normal, fontWeight: '800', fontVariant: ['tabular-nums'] },
  detalles: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: espacio.s },
  precio: { fontSize: letra.chica },
  controles: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  espaciador: { flex: 1 },
  cantidad: { minWidth: 36, textAlign: 'center', fontSize: letra.grande, fontWeight: '800' },
});
