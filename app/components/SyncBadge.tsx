import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SyncStatus } from '../types';

interface SyncBadgeProps {
  status: SyncStatus;
}

const statusConfig = {
  draft: { label: 'Draft', color: '#8B8FA8' },
  syncing: { label: 'Syncing…', color: '#F59E0B' },
  synced: { label: 'Synced', color: '#10B981' },
  failed: { label: 'Sync Failed', color: '#EF4444' },
};

export function SyncBadge({ status }: SyncBadgeProps) {
  const config = statusConfig[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.color }]}>
      <Text style={styles.text}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});