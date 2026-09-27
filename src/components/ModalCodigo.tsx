import { useState } from 'react';
import { validarCodigoEscrito } from '../lib/codigos';
import { Boton } from './Boton';
import { CampoTexto } from './Campos';
import { Hoja } from './Hoja';

interface Props {
  visible: boolean;
  onCerrar: () => void;
  /** Recibe el código ya validado y normalizado. */
  onBuscar: (codigo: string) => void;
}

/** Para escribir el código de barras a mano cuando la cámara no lo lee. */
export function ModalCodigo({ visible, ...props }: Props) {
  // Se monta solo al abrir, para empezar siempre con el campo vacío.
  return visible ? <FormularioCodigo {...props} /> : null;
}

function FormularioCodigo({ onCerrar, onBuscar }: Omit<Props, 'visible'>) {
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);

  const buscar = () => {
    const r = validarCodigoEscrito(texto);
    if (!r.ok) return setError(r.error);
    onBuscar(r.codigo);
  };

  return (
    <Hoja
      visible
      titulo="Escribir código"
      subtitulo="Los números que están debajo de las barras."
      onCerrar={onCerrar}
    >
      <CampoTexto
        etiqueta="Código de barras"
        placeholder="7501234567890"
        value={texto}
        onChangeText={(t) => {
          setTexto(t.replace(/[^\d ]/g, ''));
          setError(null);
        }}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={16}
        autoFocus
        onSubmitEditing={buscar}
        returnKeyType="search"
        error={error}
        ayuda="13 dígitos (EAN-13), 12 (UPC-A) u 8 (EAN-8)."
        style={{ fontSize: 26, letterSpacing: 2 }}
      />
      <Boton titulo="Buscar producto" icono="search" onPress={buscar} />
    </Hoja>
  );
}
