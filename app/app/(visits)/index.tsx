import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, useColorScheme as getSystemColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useVisitStore } from '../../store/visitStore';
import { VisitCard } from '../../components/VisitCard';
import { SyncIndicator } from '../../components/SyncIndicator';
import { Ionicons } from '@expo/vector-icons';
import { useEffectiveColorScheme } from '../../store/themeStore';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';

export default function VisitListScreen() {
  const router = useRouter();
  const { visits, loadVisits } = useVisitStore();
  const systemColorScheme = getSystemColorScheme();
  const effectiveColorScheme = useEffectiveColorScheme(systemColorScheme);
  const isDark = effectiveColorScheme === 'dark';

  useEffect(() => {
    const initScreen = async () => {
      try {
        // Load visits from local database
        // Background sync will handle syncing automatically
        console.log('[VisitListScreen] Loading from local database...');
        await loadVisits();
        console.log('[VisitListScreen] ✓ Local database loaded');
      } catch (error) {
        console.error('[VisitListScreen] Error during init:', error);
      }
    };
    initScreen();
  }, [loadVisits]);

  const handleVisitPress = (visitId: string) => {
    router.push(`/(visits)/${visitId}`);
  };

  const handleCreatePress = () => {
    router.push('/(visits)/create');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors[effectiveColorScheme].background }]}>
      <View style={[styles.headerBar, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa', borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}>
        <Ionicons name="list" size={24} color={Colors[effectiveColorScheme].text} />
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: Colors[effectiveColorScheme].text }]}>Visit Logs</Text>
          <Text style={[styles.headerSubtitle, { color: isDark ? '#999' : '#777' }]}>Manage your visits</Text>
        </View>
      </View>
      <ThemedView style={styles.container}>
        <SyncIndicator />
        {visits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: Colors[effectiveColorScheme].text }]}>No visits logged yet</Text>
            <Text style={[styles.emptySubtext, { color: isDark ? '#999' : '#777' }]}>Tap the + button to add your first visit</Text>
          </View>
        ) : (
          <FlatList
            data={visits}
            keyExtractor={(item, index) => item.id || `visit-${index}`}
            renderItem={({ item }) => (
              <VisitCard visit={item} onPress={() => handleVisitPress(item.id)} />
            )}
            contentContainerStyle={styles.listContainer}
            scrollIndicatorInsets={{ right: 1 }}
          />
        )}
        <TouchableOpacity style={styles.fab} onPress={handleCreatePress}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '400',
  },
  listContainer: {
    paddingVertical: 12,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});