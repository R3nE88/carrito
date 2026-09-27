import assert from 'node:assert/strict';
import { test } from 'node:test';
import { digitoVerificadorValido, normalizarCodigo, validarCodigoEscrito } from '../src/lib/codigos';
import { centavosAEntrada, formatoDinero, leerPrecio } from '../src/lib/dinero';
import { diasDesde, esPrecioViejo, formatoFecha, haceCuanto } from '../src/lib/fechas';
import { armarNombre, buscarNombreProducto } from '../src/lib/openFoodFacts';
import { normalizarTexto } from '../src/lib/texto';

test('formato de dinero en pesos', () => {
  assert.equal(formatoDinero(123450), '$1,234.50');
  assert.equal(formatoDinero(0), '$0.00');
  assert.equal(formatoDinero(5), '$0.05');
  assert.equal(formatoDinero(99999999), '$999,999.99');
  assert.equal(formatoDinero(-2350), '-$23.50');
  assert.equal(formatoDinero(100000000), '$1,000,000.00');
});

test('leer precio escrito por el usuario', () => {
  assert.equal(leerPrecio('28'), 2800);
  assert.equal(leerPrecio('28.5'), 2850);
  assert.equal(leerPrecio('28.50'), 2850);
  assert.equal(leerPrecio('28,50'), 2850);
  assert.equal(leerPrecio('$1,234.50'), 123450);
  assert.equal(leerPrecio('1,234'), 123400);
  assert.equal(leerPrecio('.5'), 50);
  assert.equal(leerPrecio(' 12. '), 1200);
  assert.equal(leerPrecio(''), null);
  assert.equal(leerPrecio('0'), null);
  assert.equal(leerPrecio('abc'), null);
  assert.equal(leerPrecio('1.234'), null);
  assert.equal(leerPrecio('1000000'), null);
  assert.equal(centavosAEntrada(2850), '28.50');
  assert.equal(centavosAEntrada(null), '');
});

test('códigos de barras EAN-13, UPC-A y EAN-8', () => {
  assert.ok(digitoVerificadorValido('7501055300075')); // EAN-13
  assert.ok(digitoVerificadorValido('036000291452')); // UPC-A
  assert.ok(digitoVerificadorValido('96385074')); // EAN-8
  assert.ok(!digitoVerificadorValido('7501055300076'));

  assert.equal(normalizarCodigo('7501055300075'), '7501055300075');
  assert.equal(normalizarCodigo('036000291452'), '0036000291452'); // UPC-A -> EAN-13
  assert.equal(normalizarCodigo('0036000291452'), '0036000291452'); // iPhone lo reporta así
  assert.equal(normalizarCodigo('96385074'), '96385074');
  assert.equal(normalizarCodigo('12345'), null);
  assert.equal(normalizarCodigo('7501055300076'), null);

  assert.deepEqual(validarCodigoEscrito('750 1055 300075'), { ok: true, codigo: '7501055300075' });
  assert.equal(validarCodigoEscrito('').ok, false);
  const corto = validarCodigoEscrito('12345');
  assert.ok(!corto.ok && corto.error.includes('5 dígitos'));
  const malo = validarCodigoEscrito('7501055300076');
  assert.ok(!malo.ok && malo.error.includes('no es válido'));
});

test('fechas y precio viejo (más de 60 días)', () => {
  const ahora = new Date(2026, 8, 27, 12, 0);
  assert.equal(formatoFecha(new Date(2026, 8, 27, 9, 0).toISOString()), '27 sep 2026');
  assert.equal(diasDesde(new Date(2026, 8, 26, 23, 0).toISOString(), ahora), 1);
  assert.equal(haceCuanto(new Date(2026, 8, 27, 1, 0).toISOString(), ahora), 'hoy');
  assert.equal(haceCuanto(new Date(2026, 8, 26).toISOString(), ahora), 'ayer');
  assert.equal(haceCuanto(new Date(2026, 8, 20).toISOString(), ahora), 'hace 7 días');
  assert.equal(esPrecioViejo(new Date(2026, 6, 29).toISOString(), ahora), false); // 60 días
  assert.equal(esPrecioViejo(new Date(2026, 6, 28).toISOString(), ahora), true); // 61 días
});

test('texto sin acentos para buscar', () => {
  assert.equal(normalizarTexto('  Plátano   Tabasco '), 'platano tabasco');
  assert.equal(normalizarTexto('PIÑA'), 'pina');
});

test('nombre armado desde Open Food Facts', () => {
  assert.equal(
    armarNombre({ product_name: 'Leche entera', brands: 'Lala,Grupo Lala', quantity: '1 L' }),
    'Leche entera Lala 1 L',
  );
  assert.equal(armarNombre({ product_name_es: 'Coca-Cola', product_name: 'Coke', brands: 'Coca-Cola' }), 'Coca-Cola');
  assert.equal(armarNombre({ brands: 'Bimbo' }), 'Bimbo');
  assert.equal(armarNombre({}), '');
});

test('búsqueda en Open Food Facts: encontrado, no encontrado y sin internet', async () => {
  let urlPedida = '';
  const encontrado = await buscarNombreProducto('7501055300075', {
    fetchFn: (async (url: string) => {
      urlPedida = url;
      return new Response(JSON.stringify({ status: 1, product: { product_name: 'Leche', brands: 'Lala' } }));
    }) as typeof fetch,
  });
  assert.deepEqual(encontrado, { estado: 'encontrado', nombre: 'Leche Lala' });
  assert.ok(urlPedida.startsWith('https://world.openfoodfacts.org/api/v2/product/7501055300075.json'));

  const noExiste = await buscarNombreProducto('7501055300075', {
    fetchFn: (async () => new Response('{"status":0}', { status: 404 })) as typeof fetch,
  });
  assert.deepEqual(noExiste, { estado: 'no-encontrado' });

  const sinRed = await buscarNombreProducto('7501055300075', {
    fetchFn: (async () => {
      throw new TypeError('Network request failed');
    }) as typeof fetch,
  });
  assert.deepEqual(sinRed, { estado: 'sin-conexion' });

  const lento = await buscarNombreProducto('7501055300075', {
    timeoutMs: 20,
    fetchFn: ((_url: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('abort', 'AbortError')));
      })) as typeof fetch,
  });
  assert.deepEqual(lento, { estado: 'sin-conexion' });
});
