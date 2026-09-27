import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useIsFocused, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AvisoFlotante, type Aviso } from '../components/AvisoFlotante';
import { Boton } from '../components/Boton';
import { ModalCodigo } from '../components/ModalCodigo';
import { ResumenCompra } from '../components/ResumenCompra';
import { SelectorTienda } from '../components/SelectorTienda';
import { useCompra } from '../context/CompraContext';
import { useFlujoProducto } from '../hooks/useFlujoProducto';
import { normalizarCodigo } from '../lib/codigos';
import { DUPLICADO_MS, TIPOS_CODIGO } from '../lib/config';
import { espacio, letra, useColores } from '../theme/tema';

/** Pantalla de la cámara para escanear productos uno tras otro. */
export default function PantallaEscanear() {
  const c = useColores();
  const router = useRouter();
  const enfocada = useIsFocused();
  const insets = useSafeAreaInsets();
  const { listo, tiendaActual } = useCompra();
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [verCodigo, setVerCodigo] = useState(false);
  const [verSelector, setVerSelector] = useState(false);
  const flujo = useFlujoProducto({ alAvisar: setAviso });
  const { procesarCodigo } = flujo;
  const ocultarAviso = useCallback(() => setAviso(null), []);

  // Último código leído y si estamos procesando uno (para no leer dos veces).
  const ultimo = useRef({ codigo: '', momento: 0 });
  const procesando = useRef(false);
  const pausado = flujo.abierto || verCodigo || verSelector;

  // Al cerrar un formulario, el mismo código no se vuelve a leer de inmediato.
  useEffect(() => {
    if (!pausado) ultimo.current.momento = Date.now();
  }, [pausado]);

  // Sin tienda elegida no se puede escanear: regresa a la pantalla principal.
  useEffect(() => {
    if (!listo || tiendaActual) return;
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [listo, tiendaActual, router]);

  const alLeer = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (procesando.current) return;
      const codigo = normalizarCodigo(data);
      if (!codigo) return;

      const ahora = Date.now();
      if (codigo === ultimo.current.codigo && ahora - ultimo.current.momento < DUPLICADO_MS) return;
      ultimo.current = { codigo, momento: ahora };

      procesando.current = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      procesarCodigo(codigo).finally(() => {
        procesando.current = false;
        ultimo.current.momento = Date.now();
      });
    },
    [procesarCodigo],
  );

  const cerrar = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!permiso) {
    return (
      <View style={[styles.centro, { backgroundColor: c.fondo }]}>
        <ActivityIndicator size="large" color={c.primario} />
      </View>
    );
  }

  if (!permiso.granted) {
    return (
      <View style={[styles.permiso, { backgroundColor: c.fondo, paddingTop: insets.top + espacio.xl, paddingBottom: insets.bottom + espacio.l }]}>
        <Ionicons name="camera-outline" size={72} color={c.primario} />
        <Text style={[styles.permisoTitulo, { color: c.texto }]}>Necesitamos tu cámara</Text>
        <Text style={[styles.permisoTexto, { color: c.textoSuave }]}>
          Carrito usa la cámara solo para leer el código de barras de tus productos y sumarlos a tu compra. No se
          toman ni se guardan fotos.
        </Text>
        {permiso.canAskAgain ? (
          <Boton titulo="Permitir cámara" icono="camera-outline" grande onPress={pedirPermiso} style={styles.anchoCompleto} />
        ) : (
          <>
            <Text style={[styles.permisoTexto, { color: c.aviso }]}>
              El permiso de cámara está desactivado. Actívalo en los Ajustes del celular.
            </Text>
            <Boton titulo="Abrir Ajustes" icono="settings-outline" grande onPress={() => Linking.openSettings()} style={styles.anchoCompleto} />
          </>
        )}
        <Boton titulo="Escribir el código a mano" icono="keypad-outline" variante="secundario" onPress={() => setVerCodigo(true)} style={styles.anchoCompleto} />
        <Boton titulo="Volver al carrito" variante="suave" onPress={cerrar} style={styles.anchoCompleto} />
        {flujo.formulario}
        <ModalCodigo
          visible={verCodigo}
          onCerrar={() => setVerCodigo(false)}
          onBuscar={(codigo) => {
            setVerCodigo(false);
            flujo.procesarCodigo(codigo);
          }}
        />
        {aviso ? <AvisoFlotante aviso={aviso} onOcultar={ocultarAviso} /> : null}
      </View>
    );
  }

  return (
    <View style={styles.pantalla}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        active={enfocada}
        barcodeScannerSettings={{ barcodeTypes: [...TIPOS_CODIGO] }}
        onBarcodeScanned={pausado ? undefined : alLeer}
      />

      <View style={[styles.capa, { paddingTop: insets.top + espacio.s, paddingBottom: insets.bottom + espacio.m }]}>
        <ResumenCompra compacto onCambiarTienda={() => setVerSelector(true)} />

        <View style={styles.guiaCaja}>
          <View style={[styles.guia, { borderColor: pausado ? 'rgba(255,255,255,0.3)' : '#FFFFFF' }]} />
          <Text style={styles.guiaTexto}>
            {pausado ? 'Escáner en pausa' : 'Apunta al código de barras'}
          </Text>
        </View>

        <View style={styles.abajo}>
          {aviso ? <AvisoFlotante aviso={aviso} onOcultar={ocultarAviso} duracion={5000} /> : null}
          <View style={styles.botones}>
            <Boton
              titulo="Escribir código"
              icono="keypad-outline"
              variante="secundario"
              onPress={() => setVerCodigo(true)}
              style={styles.flex}
            />
            <Boton titulo="Listo" icono="checkmark-circle" onPress={cerrar} style={styles.flex} />
          </View>
        </View>
      </View>

      {flujo.formulario}
      <SelectorTienda visible={verSelector} onCerrar={() => setVerSelector(false)} />
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
  pantalla: { flex: 1, backgroundColor: '#000' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  capa: { flex: 1, paddingHorizontal: espacio.l, justifyContent: 'space-between' },
  guiaCaja: { alignItems: 'center', gap: espacio.m },
  guia: { width: '85%', maxWidth: 360, aspectRatio: 2.2, borderWidth: 3, borderRadius: 18 },
  guiaTexto: {
    color: '#FFFFFF',
    fontSize: letra.normal,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: espacio.m,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  abajo: { gap: espacio.m },
  botones: { flexDirection: 'row', gap: espacio.s },
  flex: { flex: 1 },
  permiso: { flex: 1, alignItems: 'center', paddingHorizontal: espacio.xl, gap: espacio.l },
  permisoTitulo: { fontSize: letra.titulo, fontWeight: '900', textAlign: 'center' },
  permisoTexto: { fontSize: letra.normal, textAlign: 'center' },
  anchoCompleto: { alignSelf: 'stretch' },
});
