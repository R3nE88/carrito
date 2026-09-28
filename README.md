# Carrito 🛒

App para ir sumando tu compra mientras metes productos al carrito y comparar precios entre las tiendas donde compras. Todo se guarda en tu celular: sin cuentas, sin servidor y funciona sin internet.

- Escanea el código de barras (EAN-13, UPC-A, EAN-8) y ve el total en pesos todo el tiempo.
- Cada tienda guarda sus propios precios, con fecha e historial de cambios.
- Compara cuánto costaría tu carrito en cada tienda.

Hecha con Expo SDK 57 + React Native + TypeScript.

## 1. Probarla en tu celular con Expo Go

No necesitas cuenta de Expo para esto.

Necesitas [Node.js](https://nodejs.org) 20 o más reciente en tu computadora y la app **Expo Go** en tu celular ([iPhone](https://apps.apple.com/app/expo-go/id982107779) · [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)).

```bash
npm install
npx expo start
```

Aparece un código QR en la terminal:

- **iPhone:** ábrelo con la app de Cámara y toca el aviso de Expo Go.
- **Android:** ábrelo desde Expo Go → «Scan QR code».

La computadora y el celular deben estar en la misma red Wi-Fi. Si no conecta, usa `npx expo start --tunnel`.

> Si Expo Go dice que el proyecto no es compatible, actualiza Expo Go desde la tienda de apps (debe soportar SDK 57).

## 2. Generar el APK para Android

El APK se construye en la nube con EAS. Es gratis, pero es el único paso que necesita una cuenta en [expo.dev](https://expo.dev/signup).

```bash
npx eas-cli@latest login     # entra con tu cuenta de Expo
npx eas-cli@latest init      # solo la primera vez: crea el proyecto en tu cuenta
npm run build:apk            # = eas build --platform android --profile preview
```

Tarda unos minutos. Al terminar, la terminal muestra un enlace y un QR para descargar el `.apk`. También lo encuentras en expo.dev → tu proyecto → Builds.

## 3. Instalar el APK

1. Abre el enlace (o escanea el QR) desde tu Android y descarga el `.apk`.
2. Ábrelo. Si Android lo pide, permite **«Instalar apps desconocidas»** para tu navegador o administrador de archivos.
3. Toca **Instalar**. Listo: aparece como «Carrito» en tus apps.

Para actualizar, genera otro APK e instálalo encima; tus datos se conservan. Si desinstalas la app, se borran tus tiendas y precios.

## Cómo se usa

1. Agrega tus tiendas (Walmart, Soriana, Mercado…).
2. Elige en qué tienda estás y toca **Escanear**.
3. Si el producto ya tiene precio en esa tienda, se suma solo. Si no, te pide el precio (y te muestra lo que cuesta en otras tiendas). Si es nuevo, busca el nombre en [Open Food Facts](https://world.openfoodfacts.org); sin internet, lo escribes tú.
4. Para frutas, verduras o granel usa **Sin código**. Si la cámara no lee un código, usa **Escribir código**.
5. Toca un producto del carrito para corregir su precio. **Comparar tiendas** te dice cuánto costaría tu carrito en cada una.
6. **Terminar compra** vacía el carrito; los precios se quedan guardados.

## Para desarrolladores

```bash
npm test            # pruebas de la lógica y la base de datos (incluye el flujo completo)
npm run typecheck   # revisión de tipos de TypeScript
npm run lint        # ESLint
```

```
src/
  app/          Pantallas (Expo Router): compra, escáner, comparar, productos, tiendas
  components/   Piezas de interfaz reutilizables (botones, formularios, filas…)
  context/      Estado compartido de la compra (tienda actual, carrito, presupuesto)
  db/           SQLite: esquema, tiendas, productos, precios, carrito
  hooks/        Flujo para agregar productos (escáner / código / sin código)
  lib/          Utilidades: dinero, fechas, códigos de barras, Open Food Facts
  theme/        Colores (claro y oscuro) y tamaños
tests/          Pruebas con Node (node:test + SQLite en memoria)
```

Ajustes fáciles de cambiar en `src/lib/config.ts` (días para «precio viejo», tiempo anti-duplicados, etc.) y `src/theme/tema.ts` (colores y tamaños de letra).
