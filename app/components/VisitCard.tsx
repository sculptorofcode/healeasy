import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme as getSystemColorScheme } from 'react-native';
import { Visit } from '../types';
import { SyncBadge } from './SyncBadge';
import dayjs from 'dayjs';
import { useEffectiveColorScheme } from '../store/themeStore';
import { Colors } from '../constants/theme';

interface VisitCardProps {
  visit: Visit;
  onPress: () => void;
}

export function VisitCard({ visit, onPress }: VisitCardProps) {
  const systemColorScheme = getSystemColorScheme();
  const effectiveColorScheme = useEffectiveColorScheme(systemColorScheme);
  const isDark = effectiveColorScheme === 'dark';
  
  const summary = visit.aiSummary?.meetingSummary || visit.rawNotes;
  const shortSummary = summary.length > 80 ? `${summary.substring(0, 80)}…` : summary;

  const cardBgColor = isDark ? '#2a2a2a' : '#fff';
  const cardBorderColor = isDark ? '#444' : '#e0e0e0';

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: cardBgColor,
          borderColor: cardBorderColor,
        }
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text 
          style={[
            styles.customerName, 
            { color: Colors[effectiveColorScheme].text }
          ]}
        >
          {visit.customerName}
        </Text>
        <SyncBadge status={visit.syncStatus} />
      </View>
      <Text 
        style={[
          styles.dateTime, 
          { color: isDark ? '#aaa' : '#666' }
        ]}
      >
        {dayjs(visit.visitDateTime).format('MMM D, YYYY h:mm A')}
      </Text>
      <Text 
        style={[
          styles.summary, 
          { color: isDark ? '#ccc' : '#555' }
        ]}
      >
        {shortSummary}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  dateTime: {
    fontSize: 13,
    marginBottom: 10,
    fontWeight: '500',
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
  },
});