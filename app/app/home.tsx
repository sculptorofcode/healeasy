import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme as getSystemColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useEffectiveColorScheme } from '../store/themeStore';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function HomeScreen() {
  const router = useRouter();
  const systemColorScheme = getSystemColorScheme();
  const effectiveColorScheme = useEffectiveColorScheme(systemColorScheme);
  const { user, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isDark = effectiveColorScheme === 'dark';

  useEffect(() => {
    console.log('[Navigation] → HomeScreen');
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <ThemedView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}>
          <ThemedText type="title" style={styles.headerTitle}>
            HealEasy
          </ThemedText>
          <ThemedText style={[styles.welcome, { color: isDark ? '#aaa' : '#666' }]}>
            Welcome, {user?.name}!
          </ThemedText>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: isDark ? '#e0e0e0' : '#333' }]}>
              Quick Actions
            </ThemedText>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa' }]} onPress={() => router.push('/(visits)/create')}>
              <Text style={styles.actionIcon}>📝</Text>
              <View style={styles.actionContent}>
                <ThemedText style={[styles.actionTitle, { color: isDark ? '#fff' : '#333' }]}>Log Visit</ThemedText>
                <ThemedText style={[styles.actionDescription, { color: isDark ? '#aaa' : '#666' }]}>
                  Record a new customer visit
                </ThemedText>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa' }]} onPress={() => { console.log('[Navigation] Navigating to visits list'); router.push('/(visits)'); }}>
              <Text style={styles.actionIcon}>📊</Text>
              <View style={styles.actionContent}>
                <ThemedText style={[styles.actionTitle, { color: isDark ? '#fff' : '#333' }]}>My Visits</ThemedText>
                <ThemedText style={[styles.actionDescription, { color: isDark ? '#aaa' : '#666' }]}>
                  View all your recorded visits
                </ThemedText>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={[styles.sectionTitle, { color: isDark ? '#e0e0e0' : '#333' }]}>
              Account
            </ThemedText>

            <View style={[styles.infoCard, { backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa' }]}>
              <ThemedText style={[styles.infoLabel, { color: isDark ? '#aaa' : '#666' }]}>Email</ThemedText>
              <ThemedText style={[styles.infoValue, { color: isDark ? '#fff' : '#333' }]}>{user?.email}</ThemedText>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: isDark ? '#333' : '#e0e0e0' }]}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <Text style={styles.logoutText}>
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  welcome: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
  },
  actionArrow: {
    fontSize: 20,
    color: '#007AFF',
    marginLeft: 8,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});