import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, useColorScheme as getSystemColorScheme } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from '../store/authStore';
import { useThemeStore, useEffectiveColorScheme } from '../store/themeStore';
import { useVisitStore } from '../store/visitStore';
import { useBgSync } from '../hooks/useBgSync';
// Import to initialize database
import '../db/client';

export default function RootLayout() {
  const { isAuthenticated, restoreSession, user } = useAuthStore();
  const { syncFromServer, loadVisits } = useVisitStore();
  const navigation = useNavigation();
  const systemColorScheme = getSystemColorScheme();
  
  // Subscribe to theme store changes
  const theme = useThemeStore((state) => state.theme);
  const initTheme = useThemeStore((state) => state.initTheme);
  const effectiveColorScheme = useEffectiveColorScheme(systemColorScheme);
  
  const [isInitializing, setIsInitializing] = useState(true);
  const lastRouteRef = useRef<string>('');

  // Enable background sync with network monitoring
  useBgSync();

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('[RootLayout] Starting initialization...');
        await initTheme();
        console.log('[RootLayout] Theme initialized');
        await restoreSession();
        console.log('[RootLayout] Session restored');
        
        // Load visits from local database
        console.log('[RootLayout] Loading visits...');
        await loadVisits();
      } catch (error) {
        console.error('[RootLayout] Initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    initialize();
  }, [initTheme]);

  // Initial sync from server when user authenticates
  useEffect(() => {
    if (isAuthenticated && !isInitializing) {
      console.log('[RootLayout] Initial sync on auth...');
      syncFromServer();
    }
  }, [isAuthenticated, isInitializing]);

  // Track navigation changes
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('state', (state: any) => {
      const route = state.data?.state?.routes?.[state.data.state.routes.length - 1]?.name;
      if (route && route !== lastRouteRef.current) {
        console.log('[Navigation] → Navigated to:', route);
        lastRouteRef.current = route;
      }
    });

    return unsubscribeFocus;
  }, [navigation]);

  const navigationTheme = effectiveColorScheme === 'dark' ? DarkTheme : DefaultTheme;

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <SafeAreaProvider>
        <ThemeProvider value={navigationTheme}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
          <StatusBar style={effectiveColorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <Stack 
          screenOptions={{ headerShown: false }}
          initialRouteName={isAuthenticated ? 'home' : 'auth/login'}
        >
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/signup" />
          <Stack.Screen name="home" />
          <Stack.Screen name="(visits)" options={{ title: 'Visits' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style={effectiveColorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});