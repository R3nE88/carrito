import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { espacio, letra, useColores } from '../theme/tema';
import { BotonIcono } from './BotonIcono';

interface Props {
  visible: boolean;
  titulo: string;
  subtitulo?: string;
  onCerrar: () => void;
  children: ReactNode;
}

/**
 * Ventana emergente para formularios. Se muestra en la parte de arriba
 * para que el teclado nunca tape los campos ni el botón de guardar.
 */
export function Hoja({ visible, titulo, subtitulo, onCerrar, children }: Props) {
  const c = useColores();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <KeyboardAvoidingView behavior="padding" style={[styles.flex, { backgroundColor: c.velo }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCerrar} accessibilityLabel="Cerrar" />
        <View
          style={[styles.velo, { paddingTop: insets.top + espacio.m, paddingBottom: insets.bottom + espacio.m }]}
        >
        <View style={[styles.tarjeta, { backgroundColor: c.tarjeta }]} accessibilityViewIsModal>
          <View style={styles.encabezado}>
            <View style={styles.titulos}>
              <Text style={[styles.titulo, { color: c.texto }]} accessibilityRole="header">
                {titulo}
              </Text>
              {subtitulo ? <Text style={[styles.subtitulo, { color: c.textoSuave }]}>{subtitulo}</Text> : null}
            </View>
            <BotonIcono icono="close" etiqueta="Cerrar" onPress={onCerrar} />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.contenido}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  velo: { flex: 1, paddingHorizontal: espacio.m, pointerEvents: 'box-none' },
  tarjeta: {
    borderRadius: 20,
    maxHeight: '100%',
    overflow: 'hidden',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.m,
    padding: espacio.l,
    paddingBottom: espacio.s,
  },
  titulos: { flex: 1, gap: 2 },
  titulo: { fontSize: letra.grande, fontWeight: '800' },
  subtitulo: { fontSize: letra.chica },
  contenido: { padding: espacio.l, paddingTop: espacio.s, gap: espacio.m },
});
