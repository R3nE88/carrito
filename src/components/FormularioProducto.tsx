import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { PrecioEnTienda, Producto, ProductoResumen } from '../db/tipos';
import { centavosAEntrada, formatoDinero, leerPrecio } from '../lib/dinero';
import { mensajeDeError } from '../lib/dialogos';
import type { BusquedaNombre } from '../lib/openFoodFacts';
import { espacio, letra, useColores } from '../theme/tema';
import { Boton } from './Boton';
import { CampoPrecio, CampoTexto } from './Campos';
import { Hoja } from './Hoja';
import { ReferenciasPrecios } from './ReferenciasPrecios';

export type ModoFormulario =
  /** Producto nuevo. Con código (escaneado) o sin código (frutas, verduras, granel). */
  | { tipo: 'nuevo'; codigo: string | null }
  /** Producto existente: solo se pide (o corrige) el precio. */
  | { tipo: 'precio'; producto: Producto; referencias: PrecioEnTienda[]; precioActual: number | null };

export type EstadoBusqueda = BusquedaNombre | { estado: 'buscando' } | null;

interface Props {
  modo: ModoFormulario;
  tiendaNombre: string;
  textoGuardar: string;
  onGuardar: (datos: { nombre: string; centavos: number }) => Promise<void>;
  onCerrar: () => void;
  /** Resultado de Open Food Facts (solo para productos nuevos con código). */
  busqueda?: EstadoBusqueda;
  /** Productos que coinciden con lo que se escribe (para no duplicar productos sin código). */
  sugerencias?: ProductoResumen[];
  onCambiarNombre?: (texto: string) => void;
  onElegirSugerencia?: (producto: ProductoResumen) => void;
  /** Contenido adicional al final, por ejemplo "Ver comparación". */
  pie?: ReactNode;
}

const MENSAJES_BUSQUEDA: Record<string, string> = {
  buscando: 'Buscando el nombre en Open Food Facts…',
  encontrado: 'Nombre encontrado en Open Food Facts. Puedes editarlo.',
  'no-encontrado': 'No encontramos este producto. Escribe el nombre.',
  'sin-conexion': 'Sin conexión a internet. Escribe el nombre a mano.',
  error: 'No se pudo consultar el nombre. Escríbelo a mano.',
};

/**
 * Formulario para registrar un producto nuevo o su precio en la tienda actual.
 * Se monta de nuevo (con `key`) cada vez que se abre, así empieza limpio.
 */
export function FormularioProducto({
  modo,
  tiendaNombre,
  textoGuardar,
  onGuardar,
  onCerrar,
  busqueda,
  sugerencias,
  onCambiarNombre,
  onElegirSugerencia,
  pie,
}: Props) {
  const c = useColores();
  const esNuevo = modo.tipo === 'nuevo';
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState(modo.tipo === 'precio' ? centavosAEntrada(modo.precioActual) : '');
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [errorPrecio, setErrorPrecio] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const nombreEditado = useRef(false);
  const refNombre = useRef<TextInput>(null);
  const refPrecio = useRef<TextInput>(null);

  // Cuando llega el nombre de Open Food Facts, se llena solo (si no lo escribiste ya)
  // y el cursor pasa al precio.
  useEffect(() => {
    if (busqueda?.estado === 'encontrado' && !nombreEditado.current) {
      setNombre(busqueda.nombre);
      refPrecio.current?.focus();
    } else if (busqueda && busqueda.estado !== 'buscando' && busqueda.estado !== 'encontrado') {
      refNombre.current?.focus();
    }
  }, [busqueda]);

  const guardar = async () => {
    const centavos = leerPrecio(precio);
    const nombreFinal = modo.tipo === 'precio' ? modo.producto.nombre : nombre.trim();
    let valido = true;
    if (esNuevo && !nombreFinal) {
      setErrorNombre('Escribe el nombre del producto.');
      valido = false;
    }
    if (centavos === null) {
      setErrorPrecio('Escribe un precio válido, por ejemplo 28.50');
      valido = false;
    }
    if (!valido || centavos === null) return;

    setGuardando(true);
    try {
      await onGuardar({ nombre: nombreFinal, centavos });
    } catch (e) {
      setErrorPrecio(mensajeDeError(e));
      setGuardando(false);
    }
  };

  let titulo: string;
  let subtitulo: string;
  if (modo.tipo === 'nuevo') {
    titulo = modo.codigo ? 'Producto nuevo' : 'Producto sin código';
    subtitulo = modo.codigo
      ? `Código ${modo.codigo} · ${tiendaNombre}`
      : `Frutas, verduras o granel · ${tiendaNombre}`;
  } else {
    titulo = modo.producto.nombre;
    subtitulo =
      modo.precioActual === null
        ? `Aún no tiene precio en ${tiendaNombre}. Escribe cuánto cuesta aquí.`
        : `Corregir el precio en ${tiendaNombre}`;
  }

  const buscando = busqueda?.estado === 'buscando';
  const ayudaNombre = busqueda ? MENSAJES_BUSQUEDA[busqueda.estado] : undefined;

  return (
    <Hoja visible titulo={titulo} subtitulo={subtitulo} onCerrar={onCerrar}>
      {esNuevo ? (
        <View style={styles.grupo}>
          <CampoTexto
            ref={refNombre}
            etiqueta="Nombre"
            placeholder={modo.codigo ? 'Ej. Leche entera 1 L' : 'Ej. Plátano, jamón, frijol'}
            value={nombre}
            onChangeText={(t) => {
              nombreEditado.current = true;
              setNombre(t);
              setErrorNombre(null);
              onCambiarNombre?.(t);
            }}
            autoFocus={!modo.codigo}
            autoCapitalize="sentences"
            returnKeyType="next"
            onSubmitEditing={() => refPrecio.current?.focus()}
            submitBehavior="submit"
            error={errorNombre}
            ayuda={ayudaNombre}
          />
          {buscando ? <ActivityIndicator style={styles.cargando} color={c.primario} /> : null}
        </View>
      ) : null}

      {sugerencias && sugerencias.length > 0 ? (
        <View style={styles.sugerencias}>
          <Text style={[styles.sugerenciasTitulo, { color: c.textoSuave }]}>¿Es alguno de estos?</Text>
          {sugerencias.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => onElegirSugerencia?.(s)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.sugerencia, { backgroundColor: c.tarjetaSuave, opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="return-down-forward" size={18} color={c.primario} />
              <Text style={[styles.sugerenciaNombre, { color: c.texto }]} numberOfLines={1}>
                {s.nombre}
              </Text>
              {s.minCentavos !== null ? (
                <Text style={[styles.sugerenciaPrecio, { color: c.textoSuave }]}>{formatoDinero(s.minCentavos)}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {modo.tipo === 'precio' ? <ReferenciasPrecios precios={modo.referencias} /> : null}

      <CampoPrecio
        ref={refPrecio}
        etiqueta={`Precio en ${tiendaNombre}`}
        value={precio}
        onChangeText={(t) => {
          setPrecio(t);
          setErrorPrecio(null);
        }}
        autoFocus={modo.tipo === 'precio'}
        onSubmitEditing={guardar}
        returnKeyType="done"
        error={errorPrecio}
      />

      <Boton titulo={textoGuardar} icono="checkmark-circle" onPress={guardar} cargando={guardando} grande />
      {pie}
    </Hoja>
  );
}

const styles = StyleSheet.create({
  grupo: { position: 'relative' },
  cargando: { position: 'absolute', right: espacio.m, top: 40 },
  sugerencias: { gap: espacio.xs },
  sugerenciasTitulo: { fontSize: letra.chica, fontWeight: '700' },
  sugerencia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.s,
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: espacio.m,
  },
  sugerenciaNombre: { flex: 1, fontSize: letra.normal, fontWeight: '600' },
  sugerenciaPrecio: { fontSize: letra.chica },
});
