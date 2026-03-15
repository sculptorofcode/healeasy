import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSyncStatusStore } from '../store/syncStatusStore';
import { Colors } from '../constants/theme';
import { useEffectiveColorScheme } from '../store/themeStore';
import { useColorScheme as getSystemColorScheme } from 'react-native';

export function SyncIndicator() {
  const { status, lastSyncTime } = useSyncStatusStore();
  const systemColorScheme = getSystemColorScheme();
  const effectiveColorScheme = useEffectiveColorScheme(systemColorScheme);
  const isDark = effectiveColorScheme === 'dark';

  if (status === 'idle') return null;

  const getIndicatorContent = () => {
    switch (status) {
      case 'syncing':
        return {
          icon: <ActivityIndicator size={14} color="#007AFF" />,
          text: 'Syncing...',
          color: '#007AFF',
        };
      case 'success':
        return {
          icon: <Ionicons name="checkmark-circle" size={14} color="#10B981" />,
          text: 'Synced',
          color: '#10B981',
        };
      case 'error':
        return {
          icon: <Ionicons name="alert-circle" size={14} color="#EF4444" />,
          text: 'Sync failed',
          color: '#EF4444',
        };
      case 'offline':
        return {
          icon: <Ionicons name="cloud-offline" size={14} color="#F59E0B" />,
          text: 'Offline',
          color: '#F59E0B',
        };
      default:
        return null;
    }
  };

  const content = getIndicatorContent();
  if (!content) return null;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#2a2a2a' : '#f0f9ff' }]}>
      <View style={styles.content}>
        {content.icon}
        <Text style={[styles.text, { color: content.color }]}>{content.text}</Text>
      </View>
      {lastSyncTime && status === 'success' && (
        <Text style={[styles.timestamp, { color: isDark ? '#999' : '#777' }]}>
          {new Date(lastSyncTime).toLocaleTimeString()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 11,
  },
});
