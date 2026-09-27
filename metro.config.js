// Configuración de Metro (el empaquetador de Expo).
// Solo agrega lo necesario para que expo-sqlite funcione también en la versión web
// (útil para pruebas en el navegador). En iPhone y Android no cambia nada.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  middleware(req, res, next);
};

module.exports = config;
