/** Error con un mensaje pensado para mostrarse al usuario tal cual. */
export class ErrorUsuario extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorUsuario';
  }
}
