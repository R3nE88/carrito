import { useState } from 'react';
import { useCompra } from '../context/CompraContext';
import { centavosAEntrada, leerPrecio } from '../lib/dinero';
import { Boton } from './Boton';
import { CampoPrecio } from './Campos';
import { Hoja } from './Hoja';

interface Props {
  visible: boolean;
  onCerrar: () => void;
}

/** Definir o quitar el presupuesto de la compra. */
export function ModalPresupuesto({ visible, onCerrar }: Props) {
  // Se monta solo al abrir, para empezar siempre con el valor guardado.
  return visible ? <FormularioPresupuesto onCerrar={onCerrar} /> : null;
}

function FormularioPresupuesto({ onCerrar }: { onCerrar: () => void }) {
  const { presupuesto, definirPresupuesto } = useCompra();
  const [texto, setTexto] = useState(centavosAEntrada(presupuesto));
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    const centavos = leerPrecio(texto);
    if (centavos === null) return setError('Escribe una cantidad válida, por ejemplo 1500.');
    await definirPresupuesto(centavos);
    onCerrar();
  };

  const quitar = async () => {
    await definirPresupuesto(null);
    onCerrar();
  };

  return (
    <Hoja visible titulo="Presupuesto" subtitulo="Te avisamos en rojo si te pasas." onCerrar={onCerrar}>
      <CampoPrecio
        etiqueta="¿Cuánto quieres gastar como máximo?"
        value={texto}
        onChangeText={(t) => {
          setTexto(t);
          setError(null);
        }}
        autoFocus
        error={error}
      />
      <Boton titulo="Guardar presupuesto" icono="checkmark-circle" onPress={guardar} />
      {presupuesto !== null ? (
        <Boton titulo="Quitar presupuesto" icono="close" variante="peligro" onPress={quitar} />
      ) : null}
    </Hoja>
  );
}
