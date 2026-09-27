import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { Aviso } from '../components/AvisoFlotante';
import { Boton } from '../components/Boton';
import { FormularioProducto, type EstadoBusqueda, type ModoFormulario } from '../components/FormularioProducto';
import { useCompra } from '../context/CompraContext';
import {
  actualizarPrecio,
  procesarCodigo as procesarCodigoDb,
  procesarProducto,
  registrarPrecioYAgregar,
  registrarProductoNuevo,
  type ResultadoCodigo,
} from '../db/flujo';
import { preciosDeProducto } from '../db/precios';
import { listarProductos, obtenerProducto } from '../db/productos';
import type { ItemCarrito, Producto, ProductoResumen } from '../db/tipos';
import { esPrecioViejo } from '../lib/fechas';
import { buscarNombreProducto } from '../lib/openFoodFacts';

const USER_AGENT = 'Carrito/1.0 (app personal para sumar la compra)';

type Pendiente = ModoFormulario & {
  /** Identifica cada apertura del formulario. */
  clave: number;
  /** true: al guardar también se agrega al carrito. */
  agregar: boolean;
};

interface Opciones {
  /** Se llama con un mensaje cada vez que algo se agrega o se guarda. */
  alAvisar?: (aviso: Aviso) => void;
  /** Mostrar el botón "Ver precios por tienda" (no hace falta en el detalle del producto). */
  conEnlaceDetalle?: boolean;
}

/**
 * Lógica compartida para agregar productos: por código (escaneado o escrito),
 * sin código, o corrigiendo el precio de algo que ya está en el carrito.
 * Devuelve las acciones y el formulario que hay que mostrar.
 */
export function useFlujoProducto({ alAvisar, conEnlaceDetalle = true }: Opciones = {}) {
  const router = useRouter();
  const { db, tiendaActual, recargar } = useCompra();
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const [busqueda, setBusqueda] = useState<EstadoBusqueda>(null);
  const [sugerencias, setSugerencias] = useState<ProductoResumen[]>([]);
  const contador = useRef(0);
  const claveActual = useRef(0);

  const abrir = useCallback((modo: ModoFormulario, agregar: boolean) => {
    contador.current += 1;
    claveActual.current = contador.current;
    setBusqueda(null);
    setSugerencias([]);
    setPendiente({ ...modo, agregar, clave: contador.current });
    return contador.current;
  }, []);

  const cerrar = useCallback(() => {
    claveActual.current = 0;
    setPendiente(null);
  }, []);

  const avisar = useCallback(
    (aviso: Omit<Aviso, 'id'>) => alAvisar?.({ ...aviso, id: Date.now() }),
    [alAvisar],
  );

  /** Muestra el resultado de procesar un código o un producto. */
  const atenderResultado = useCallback(
    async (r: ResultadoCodigo) => {
      if (r.tipo === 'agregado') {
        await recargar();
        avisar({
          titulo: 'Agregado',
          nombre: r.producto.nombre,
          centavos: r.centavos,
          cantidad: r.cantidad,
          precioViejo: esPrecioViejo(r.registradoEn),
        });
      } else if (r.tipo === 'pedir-precio') {
        abrir({ tipo: 'precio', producto: r.producto, referencias: r.referencias, precioActual: null }, true);
      } else {
        const clave = abrir({ tipo: 'nuevo', codigo: r.codigo }, true);
        setBusqueda({ estado: 'buscando' });
        const resultado = await buscarNombreProducto(r.codigo, {
          userAgent: Platform.OS === 'web' ? undefined : USER_AGENT,
        });
        // Solo si el formulario sigue abierto para este mismo código.
        if (claveActual.current === clave) setBusqueda(resultado);
      }
    },
    [abrir, avisar, recargar],
  );

  /** Código escaneado o escrito (ya normalizado). */
  const procesarCodigo = useCallback(
    async (codigo: string) => {
      if (!tiendaActual) return;
      await atenderResultado(await procesarCodigoDb(db, codigo, tiendaActual.id));
    },
    [atenderResultado, db, tiendaActual],
  );

  /** Agregar un producto que ya existe (desde "Mis productos" o una sugerencia). */
  const agregarProducto = useCallback(
    async (producto: Producto) => {
      if (!tiendaActual) return;
      await atenderResultado(await procesarProducto(db, producto, tiendaActual.id));
    },
    [atenderResultado, db, tiendaActual],
  );

  /** Producto sin código: frutas, verduras o granel. */
  const agregarSinCodigo = useCallback(() => {
    abrir({ tipo: 'nuevo', codigo: null }, true);
  }, [abrir]);

  /** Tocar un producto del carrito para corregir (o capturar) su precio. */
  const editarPrecio = useCallback(
    async (item: ItemCarrito) => {
      if (!tiendaActual) return;
      const producto = await obtenerProducto(db, item.productoId);
      if (!producto) return;
      const referencias = (await preciosDeProducto(db, item.productoId)).filter(
        (p) => p.tiendaId !== tiendaActual.id,
      );
      abrir({ tipo: 'precio', producto, referencias, precioActual: item.centavos }, false);
    },
    [abrir, db, tiendaActual],
  );

  const guardar = useCallback(
    async ({ nombre, centavos }: { nombre: string; centavos: number }) => {
      if (!pendiente || !tiendaActual) return;
      const tiendaId = tiendaActual.id;

      let aviso: Omit<Aviso, 'id'>;
      if (pendiente.tipo === 'nuevo') {
        const { cantidad } = await registrarProductoNuevo(db, { codigo: pendiente.codigo, nombre, centavos, tiendaId });
        aviso = { titulo: 'Guardado y agregado', nombre, centavos, cantidad };
      } else if (pendiente.agregar) {
        const cantidad = await registrarPrecioYAgregar(db, pendiente.producto.id, tiendaId, centavos);
        aviso = { titulo: 'Precio guardado y agregado', nombre, centavos, cantidad };
      } else {
        const resultado = await actualizarPrecio(db, pendiente.producto.id, tiendaId, centavos);
        aviso = { titulo: resultado === 'igual' ? 'Precio confirmado' : 'Precio actualizado', nombre, centavos };
      }
      // Primero se actualiza el total y luego se muestra el aviso, para que coincidan.
      await recargar();
      cerrar();
      avisar(aviso);
    },
    [avisar, cerrar, db, pendiente, recargar, tiendaActual],
  );

  const buscarSugerencias = useCallback(
    async (texto: string) => {
      if (texto.trim().length < 2) return setSugerencias([]);
      setSugerencias(await listarProductos(db, texto, 4));
    },
    [db],
  );

  const elegirSugerencia = useCallback(
    async (s: ProductoResumen) => {
      cerrar();
      await agregarProducto(s);
    },
    [agregarProducto, cerrar],
  );

  const formulario =
    pendiente && tiendaActual ? (
      <FormularioProducto
        key={pendiente.clave}
        modo={pendiente}
        tiendaNombre={tiendaActual.nombre}
        textoGuardar={pendiente.agregar ? 'Agregar al carrito' : 'Guardar precio'}
        onGuardar={guardar}
        onCerrar={cerrar}
        busqueda={busqueda}
        sugerencias={pendiente.tipo === 'nuevo' && !pendiente.codigo ? sugerencias : undefined}
        onCambiarNombre={pendiente.tipo === 'nuevo' && !pendiente.codigo ? buscarSugerencias : undefined}
        onElegirSugerencia={elegirSugerencia}
        pie={
          pendiente.tipo === 'precio' && conEnlaceDetalle ? (
            <Boton
              titulo="Ver precios por tienda"
              icono="swap-horizontal"
              variante="suave"
              onPress={() => {
                const id = pendiente.producto.id;
                cerrar();
                router.push(`/productos/${id}`);
              }}
            />
          ) : null
        }
      />
    ) : null;

  return {
    procesarCodigo,
    agregarProducto,
    agregarSinCodigo,
    editarPrecio,
    formulario,
    abierto: pendiente !== null,
  };
}
