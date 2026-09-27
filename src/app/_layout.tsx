import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CompraProvider } from '../context/CompraContext';
import { migrar, NOMBRE_BASE_DATOS } from '../db/esquema';
import { coloresClaros, coloresOscuros, letra } from '../theme/tema';

export default function RootLayout() {
  const oscuro = useColorScheme() === 'dark';
  const c = oscuro ? coloresOscuros : coloresClaros;
  const base = oscuro ? DarkTheme : DefaultTheme;
  const tema = {
    ...base,
    colors: {
      ...base.colors,
      primary: c.primario,
      background: c.fondo,
      card: c.tarjeta,
      text: c.texto,
      border: c.borde,
    },
  };

  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName={NOMBRE_BASE_DATOS} onInit={migrar}>
        <CompraProvider>
          <ThemeProvider value={tema}>
            <StatusBar style={oscuro ? 'light' : 'dark'} />
            <Stack
              screenOptions={{
                headerBackTitle: 'Atrás',
                headerTitleStyle: { fontSize: letra.grande, fontWeight: '800' },
                contentStyle: { backgroundColor: c.fondo },
              }}
            >
              <Stack.Screen name="index" options={{ title: 'Carrito', headerShown: false }} />
              <Stack.Screen
                name="escanear"
                options={{ title: 'Escanear', headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen name="comparar" options={{ title: 'Comparar carrito' }} />
              <Stack.Screen name="productos/index" options={{ title: 'Mis productos' }} />
              <Stack.Screen name="productos/[id]" options={{ title: 'Producto' }} />
              <Stack.Screen name="tiendas" options={{ title: 'Mis tiendas' }} />
            </Stack>
          </ThemeProvider>
        </CompraProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
