/**
 * Recorre el flujo completo de la app contra una base de datos real (SQLite en memoria):
 * crear dos tiendas, escanear un producto nuevo en la primera, registrarlo con otro
 * precio en la segunda, comparar el producto y el carrito, editar un precio y terminar la compra.
 */
import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';
import { agregarAlCarrito, cambiarCantidad, datosComparacion, listarCarrito, quitarDelCarrito, vaciarCarrito } from '../src/db/carrito';
import { migrar } from '../src/db/esquema';
import { actualizarPrecio, procesarCodigo, registrarPrecioYAgregar, registrarProductoNuevo } from '../src/db/flujo';
import { historialDeProducto, preciosDeProducto } from '../src/db/precios';
import { eliminarProducto, listarProductos, renombrarProducto } from '../src/db/productos';
import { contarPreciosDeTienda, crearTienda, eliminarTienda, listarTiendas, renombrarTienda } from '../src/db/tiendas';
import type { Db } from '../src/db/tipos';
import { AJUSTE_PRESUPUESTO, guardarAjuste, leerAjusteNumero } from '../src/db/ajustes';
import { calcularComparacion } from '../src/lib/comparacion';
import { crearDbPrueba } from './dbNode';

const LECHE = '7501055300075';
const T1 = '2026-07-01T15:00:00.000Z';
const T2 = '2026-09-27T15:00:00.000Z';

let db: Db;

beforeEach(async () => {
  db = crearDbPrueba();
  await migrar(db);
});

describe('tiendas', () => {
  test('crear, renombrar, evitar duplicados y eliminar', async () => {
    const walmart = await crearTienda(db, '  Walmart ');
    await crearTienda(db, 'Bodega Aurrera');
    await assert.rejects(crearTienda(db, 'walmart'), /Ya tienes una tienda/);
    await assert.rejects(crearTienda(db, '   '), /Escribe el nombre/);

    await renombrarTienda(db, walmart, 'Walmart Express');
    assert.deepEqual(
      (await listarTiendas(db)).map((t) => t.nombre),
      ['Bodega Aurrera', 'Walmart Express'],
    );

    await eliminarTienda(db, walmart);
    assert.equal((await listarTiendas(db)).length, 1);
  });

  test('al eliminar una tienda se borran sus precios, pero no los productos', async () => {
    const soriana = await crearTienda(db, 'Soriana');
    const mercado = await crearTienda(db, 'Mercado');
    const { productoId } = await registrarProductoNuevo(db, { codigo: LECHE, nombre: 'Leche', centavos: 2800, tiendaId: soriana });
    await actualizarPrecio(db, productoId, mercado, 2500);
    assert.equal(await contarPreciosDeTienda(db, soriana), 1);

    await eliminarTienda(db, soriana);
    const precios = await preciosDeProducto(db, productoId);
    assert.deepEqual(precios.map((p) => p.tiendaNombre), ['Mercado']);
    assert.equal((await listarProductos(db)).length, 1);
  });
});

describe('flujo completo de compra', () => {
  test('dos tiendas, producto nuevo, otro precio, comparaciones, edición y terminar compra', async () => {
    // 1. Crear dos tiendas.
    const walmart = await crearTienda(db, 'Walmart');
    const soriana = await crearTienda(db, 'Soriana');

    // 2. Escanear un producto nuevo en la primera tienda.
    const r1 = await procesarCodigo(db, LECHE, walmart, T1);
    assert.deepEqual(r1, { tipo: 'nuevo', codigo: LECHE });
    const { productoId, cantidad } = await registrarProductoNuevo(
      db,
      { codigo: LECHE, nombre: 'Leche Lala 1 L', centavos: 2850, tiendaId: walmart },
      T1,
    );
    assert.equal(cantidad, 1);

    let carrito = await listarCarrito(db, walmart);
    assert.equal(carrito.length, 1);
    assert.equal(carrito[0].centavos, 2850);

    // Escanearlo otra vez en Walmart lo agrega automáticamente (ya tiene precio).
    const r2 = await procesarCodigo(db, LECHE, walmart, T1);
    assert.equal(r2.tipo, 'agregado');
    assert.equal(r2.tipo === 'agregado' && r2.cantidad, 2);

    // 3. En la segunda tienda existe pero sin precio: se pide solo el precio,
    //    mostrando como referencia el de Walmart.
    await vaciarCarrito(db);
    const r3 = await procesarCodigo(db, LECHE, soriana, T2);
    assert.equal(r3.tipo, 'pedir-precio');
    assert.ok(r3.tipo === 'pedir-precio');
    assert.deepEqual(
      r3.referencias.map((p) => [p.tiendaNombre, p.centavos]),
      [['Walmart', 2850]],
    );
    await registrarPrecioYAgregar(db, productoId, soriana, 2690, T2);

    // Un producto manual (sin código), solo con precio en Soriana.
    await registrarProductoNuevo(db, { codigo: null, nombre: 'Plátano', centavos: 1500, tiendaId: soriana }, T2);

    carrito = await listarCarrito(db, soriana);
    assert.deepEqual(
      carrito.map((i) => [i.nombre, i.cantidad, i.centavos]),
      [
        ['Plátano', 1, 1500],
        ['Leche Lala 1 L', 1, 2690],
      ],
    );

    // 4a. Comparación del producto: precio por tienda, del más barato al más caro.
    const precios = await preciosDeProducto(db, productoId);
    assert.deepEqual(
      precios.map((p) => [p.tiendaNombre, p.centavos, p.registradoEn]),
      [
        ['Soriana', 2690, T2],
        ['Walmart', 2850, T1],
      ],
    );

    // 4b. Comparación del carrito: Walmart no tiene precio del plátano.
    const tiendas = await listarTiendas(db);
    const datos = await datosComparacion(db);
    const ahora = new Date(T2);
    const comparacion = calcularComparacion(tiendas, datos.items, datos.precios, { ahora });
    const porNombre = Object.fromEntries(comparacion.tiendas.map((t) => [t.nombre, t]));
    assert.equal(porNombre.Soriana.total, 4190);
    assert.equal(porNombre.Soriana.completa, true);
    assert.equal(porNombre.Soriana.masBarata, true);
    assert.equal(porNombre.Walmart.total, 2850);
    assert.deepEqual(porNombre.Walmart.faltantes, ['Plátano']);
    assert.equal(porNombre.Walmart.masBarata, false);
    assert.equal(porNombre.Walmart.preciosViejos, 1); // registrado hace 88 días
    assert.equal(comparacion.tiendas[0].nombre, 'Soriana');

    // Comparando solo productos en común (la leche): Soriana sigue siendo más barata.
    const parejo = calcularComparacion(tiendas, datos.items, datos.precios, { soloEnComun: true, ahora });
    assert.equal(parejo.productosEnComun, 1);
    assert.deepEqual(
      parejo.tiendas.map((t) => [t.nombre, t.total, t.masBarata]),
      [
        ['Soriana', 2690, true],
        ['Walmart', 2850, false],
      ],
    );

    // 5. Editar un precio: el anterior pasa al historial con su fecha.
    assert.equal(await actualizarPrecio(db, productoId, soriana, 2990, T2), 'cambio');
    const historial = await historialDeProducto(db, productoId);
    assert.deepEqual(
      historial.map((h) => [h.tiendaNombre, h.centavos, h.registradoEn]),
      [['Soriana', 2690, T2]],
    );
    carrito = await listarCarrito(db, soriana);
    assert.equal(carrito.find((i) => i.productoId === productoId)?.centavos, 2990);

    // Confirmar el mismo precio solo actualiza la fecha (no agrega historial).
    assert.equal(await actualizarPrecio(db, productoId, soriana, 2990), 'igual');
    assert.equal((await historialDeProducto(db, productoId)).length, 1);

    // Cambiar cantidad y quitar.
    const leche = carrito.find((i) => i.productoId === productoId)!;
    await cambiarCantidad(db, leche.id, 3);
    await cambiarCantidad(db, leche.id, 0); // ignorado: mínimo 1
    carrito = await listarCarrito(db, soriana);
    assert.equal(carrito.find((i) => i.id === leche.id)?.cantidad, 3);

    // 6. Terminar compra: vacía el carrito sin borrar productos ni precios.
    await vaciarCarrito(db);
    assert.equal((await listarCarrito(db, soriana)).length, 0);
    assert.equal((await preciosDeProducto(db, productoId)).length, 2);
    assert.equal((await listarProductos(db)).length, 2);
  });

  test('si cambias de tienda, el carrito toma los precios de la nueva', async () => {
    const walmart = await crearTienda(db, 'Walmart');
    const mercado = await crearTienda(db, 'Mercado');
    await registrarProductoNuevo(db, { codigo: LECHE, nombre: 'Leche', centavos: 2850, tiendaId: walmart });
    const enMercado = await listarCarrito(db, mercado);
    assert.equal(enMercado[0].centavos, null);
    assert.equal(enMercado[0].registradoEn, null);
  });

  test('un producto manual con el mismo nombre no se duplica', async () => {
    const mercado = await crearTienda(db, 'Mercado');
    const a = await registrarProductoNuevo(db, { codigo: null, nombre: 'Jitomate', centavos: 3000, tiendaId: mercado });
    const b = await registrarProductoNuevo(db, { codigo: null, nombre: ' jitomate ', centavos: 3200, tiendaId: mercado });
    assert.equal(a.productoId, b.productoId);
    assert.equal(b.cantidad, 2);
    assert.equal((await historialDeProducto(db, a.productoId))[0].centavos, 3000);
  });

  test('si algo falla a medias, no se guarda nada', async () => {
    await assert.rejects(
      registrarProductoNuevo(db, { codigo: LECHE, nombre: 'Leche', centavos: 2850, tiendaId: 999 }),
    );
    assert.equal((await listarProductos(db)).length, 0);
  });
});

describe('mis productos', () => {
  test('buscar por nombre sin acentos o por código, con el precio más barato', async () => {
    const walmart = await crearTienda(db, 'Walmart');
    const aurrera = await crearTienda(db, 'Bodega Aurrera');
    const { productoId } = await registrarProductoNuevo(db, { codigo: LECHE, nombre: 'Leche Lala', centavos: 2850, tiendaId: walmart });
    await actualizarPrecio(db, productoId, aurrera, 2700);
    await registrarProductoNuevo(db, { codigo: null, nombre: 'Plátano Tabasco', centavos: 1500, tiendaId: walmart });

    const todos = await listarProductos(db);
    assert.equal(todos.length, 2);
    const [leche] = await listarProductos(db, 'lala');
    assert.equal(leche.minCentavos, 2700);
    assert.equal(leche.minTienda, 'Bodega Aurrera');
    assert.equal(leche.tiendasConPrecio, 2);
    assert.equal((await listarProductos(db, 'platano tab'))[0].nombre, 'Plátano Tabasco');
    assert.equal((await listarProductos(db, '75010553'))[0].nombre, 'Leche Lala');
    assert.equal((await listarProductos(db, 'zzz')).length, 0);

    await renombrarProducto(db, productoId, 'Leche Lala Entera 1 L');
    assert.equal((await listarProductos(db, 'entera')).length, 1);

    await agregarAlCarrito(db, productoId, T2);
    await eliminarProducto(db, productoId);
    // Solo queda el plátano en el carrito: la leche se quitó junto con el producto.
    assert.deepEqual((await listarCarrito(db, walmart)).map((i) => i.nombre), ['Plátano Tabasco']);
    assert.equal((await listarProductos(db)).length, 1);
  });

  test('quitar un producto del carrito', async () => {
    const walmart = await crearTienda(db, 'Walmart');
    await registrarProductoNuevo(db, { codigo: LECHE, nombre: 'Leche', centavos: 2850, tiendaId: walmart });
    const [item] = await listarCarrito(db, walmart);
    await quitarDelCarrito(db, item.id);
    assert.equal((await listarCarrito(db, walmart)).length, 0);
  });
});

test('ajustes: presupuesto', async () => {
  assert.equal(await leerAjusteNumero(db, AJUSTE_PRESUPUESTO), null);
  await guardarAjuste(db, AJUSTE_PRESUPUESTO, '150000');
  assert.equal(await leerAjusteNumero(db, AJUSTE_PRESUPUESTO), 150000);
  await guardarAjuste(db, AJUSTE_PRESUPUESTO, null);
  assert.equal(await leerAjusteNumero(db, AJUSTE_PRESUPUESTO), null);
});

test('la migración se puede correr varias veces', async () => {
  await migrar(db);
  await migrar(db);
  assert.equal((await listarTiendas(db)).length, 0);
});
