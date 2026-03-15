import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { AISummary } from '../types';

dayjs.extend(relativeTime);

interface AISummaryPanelProps {
  summary: AISummary;
  isDark: boolean;
}

export const AISummaryPanel: React.FC<AISummaryPanelProps> = ({ summary, isDark }) => {
  const textColor = isDark ? '#ccc' : '#555';
  const labelColor = isDark ? '#aaa' : '#777';
  const accentColor = isDark ? '#1a1a1a' : '#f0f4ff';
  const borderColor = isDark ? '#444' : '#d0e0ff';

  return (
    <View>
      {/* Header */}
      <View style={styles.aiHeaderRow}>
        <Ionicons name="sparkles" size={20} color="#007AFF" />
        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>AI Summary</Text>
      </View>

      {/* Meeting Summary */}
      <View style={styles.aiSubsection}>
        <Text style={[styles.aiSubtitle, { color: labelColor }]}>Meeting Summary</Text>
        <Text style={[styles.aiText, { color: textColor }]}>{summary.meetingSummary}</Text>
      </View>

      {/* Pain Points */}
      {summary.painPoints && summary.painPoints.length > 0 && (
        <View style={styles.aiSubsection}>
          <Text style={[styles.aiSubtitle, { color: labelColor }]}>Pain Points</Text>
          {summary.painPoints.map((point, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: '#007AFF' }]}>•</Text>
              <Text style={[styles.aiText, { color: textColor, flex: 1 }]}>{point}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Items */}
      {summary.actionItems && summary.actionItems.length > 0 && (
        <View style={styles.aiSubsection}>
          <Text style={[styles.aiSubtitle, { color: labelColor }]}>Action Items</Text>
          {summary.actionItems.map((item, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: '#10B981' }]}>{idx + 1}.</Text>
              <Text style={[styles.aiText, { color: textColor, flex: 1 }]}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recommended Next Step */}
      <View style={styles.aiSubsection}>
        <Text style={[styles.aiSubtitle, { color: labelColor }]}>Recommended Next Step</Text>
        <View style={[styles.recommendationBox, { backgroundColor: accentColor, borderColor }]}>
          <Text style={[styles.aiText, { color: textColor }]}>{summary.recommendedNextStep}</Text>
        </View>
      </View>

      {/* Timestamp */}
      <Text style={[styles.aiTimestamp, { color: isDark ? '#777' : '#999' }]}>
        Generated {dayjs(summary.generatedAt).fromNow()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  aiSubsection: {
    marginBottom: 16,
  },
  aiSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  aiText: {
    fontSize: 13,
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  recommendationBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  aiTimestamp: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
