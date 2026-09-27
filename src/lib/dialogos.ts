import { Alert, Platform } from 'react-native';
import { ErrorUsuario } from './errores';

/**
 * Diálogos de confirmación. En iPhone/Android usan la alerta nativa;
 * en la versión web (usada para pruebas) usan la del navegador.
 */

export function confirmar(opciones: {
  titulo: string;
  mensaje?: string;
  textoConfirmar: string;
  destructivo?: boolean;
}): Promise<boolean> {
  const { titulo, mensaje, textoConfirmar, destructivo } = opciones;
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(mensaje ? `${titulo}\n\n${mensaje}` : titulo));
  }
  return new Promise((resolve) => {
    Alert.alert(
      titulo,
      mensaje,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: textoConfirmar, style: destructivo ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function avisar(titulo: string, mensaje?: string): void {
  if (Platform.OS === 'web') {
    window.alert(mensaje ? `${titulo}\n\n${mensaje}` : titulo);
    return;
  }
  Alert.alert(titulo, mensaje);
}

/** Mensaje legible de un error: los de validación se muestran tal cual; los técnicos, genéricos. */
export function mensajeDeError(e: unknown): string {
  if (e instanceof ErrorUsuario) return e.message;
  console.warn(e);
  return 'No se pudo guardar. Intenta de nuevo.';
}
