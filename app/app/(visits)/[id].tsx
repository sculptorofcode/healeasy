import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useColorScheme as getSystemColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useVisitStore } from '../../store/visitStore';
import { useEffectiveColorScheme } from '../../store/themeStore';
import { Colors } from '../../constants/theme';
import { ThemedView } from '../../components/themed-view';
import { SyncBadge } from '../../components/SyncBadge';
import { AISummaryPanel } from '../../components/AISummaryPanel';
import { Visit } from '../../types';

export default function VisitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const systemColorScheme = getSystemColorScheme();
  const effectiveColorScheme = useEffectiveColorScheme(systemColorScheme);
  const isDark = effectiveColorScheme === 'dark';

  const { visits, retrySyncForVisit } = useVisitStore();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    console.log('[Navigation] → VisitDetailScreen');
    if (id && typeof id === 'string') {
      const foundVisit = visits.find((v) => v.id === id);
      setVisit(foundVisit || null);
    }
  }, [id, visits]);

  if (!visit) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors[effectiveColorScheme].background }]}>
        <View style={[styles.headerBar, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa', borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors[effectiveColorScheme].text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: Colors[effectiveColorScheme].text }]}>Visit Details</Text>
        </View>
        <ThemedView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.emptyText, { color: Colors[effectiveColorScheme].text }]}>Visit not found</Text>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const handleRetrySync = async () => {
    setIsRetrying(true);
    try {
      await retrySyncForVisit(visit.id);
      Alert.alert('Success', 'Sync retry initiated');
    } catch (error) {
      Alert.alert('Error', 'Failed to retry sync');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleEdit = () => {
    router.push(`/(visits)/${visit.id}/edit`);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors[effectiveColorScheme].background }]}>
      <View style={[styles.headerBar, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa', borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors[effectiveColorScheme].text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: Colors[effectiveColorScheme].text }]}>Visit Details</Text>
          <Text style={[styles.headerSubtitle, { color: isDark ? '#999' : '#777' }]}>View and manage</Text>
        </View>
      </View>

      <ScrollView style={[styles.container, { backgroundColor: Colors[effectiveColorScheme].background }]}>
        {/* Customer Info */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', borderColor: isDark ? '#444' : '#e0e0e0' }]}>
          <Text style={[styles.sectionTitle, { color: Colors[effectiveColorScheme].text }]}>Customer Information</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: isDark ? '#aaa' : '#777' }]}>Name</Text>
            <Text style={[styles.value, { color: Colors[effectiveColorScheme].text }]}>{visit.customerName}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: isDark ? '#444' : '#e0e0e0' }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: isDark ? '#aaa' : '#777' }]}>Contact Person</Text>
            <Text style={[styles.value, { color: Colors[effectiveColorScheme].text }]}>{visit.contactPerson}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: isDark ? '#444' : '#e0e0e0' }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: isDark ? '#aaa' : '#777' }]}>Location</Text>
            <Text style={[styles.value, { color: Colors[effectiveColorScheme].text }]}>{visit.location}</Text>
          </View>
        </View>

        {/* Visit Details */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', borderColor: isDark ? '#444' : '#e0e0e0' }]}>
          <Text style={[styles.sectionTitle, { color: Colors[effectiveColorScheme].text }]}>Visit Details</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: isDark ? '#aaa' : '#777' }]}>Date & Time</Text>
            <Text style={[styles.value, { color: Colors[effectiveColorScheme].text }]}>
              {dayjs(visit.visitDateTime).format('MMM D, YYYY h:mm A')}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: isDark ? '#444' : '#e0e0e0' }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: isDark ? '#aaa' : '#777' }]}>Outcome Status</Text>
            <Text style={[styles.value, { color: Colors[effectiveColorScheme].text }]}>
              {visit.outcomeStatus.replaceAll('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </Text>
          </View>
          {visit.nextFollowUpDate && (
            <>
              <View style={[styles.divider, { backgroundColor: isDark ? '#444' : '#e0e0e0' }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: isDark ? '#aaa' : '#777' }]}>Follow-up Date</Text>
                <Text style={[styles.value, { color: Colors[effectiveColorScheme].text }]}>
                  {dayjs(visit.nextFollowUpDate).format('MMM D, YYYY')}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Meeting Notes */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', borderColor: isDark ? '#444' : '#e0e0e0' }]}>
          <Text style={[styles.sectionTitle, { color: Colors[effectiveColorScheme].text }]}>Meeting Notes</Text>
          <Text style={[styles.notesText, { color: isDark ? '#ccc' : '#555' }]}>{visit.rawNotes}</Text>
        </View>

        {/* AI Summary (if available) */}
        {visit.aiSummary && (
          <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', borderColor: isDark ? '#444' : '#e0e0e0' }]}>
            <AISummaryPanel summary={visit.aiSummary} isDark={isDark} />
          </View>
        )}

        {/* Sync Status */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', borderColor: isDark ? '#444' : '#e0e0e0' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: isDark ? '#aaa' : '#777' }]}>Sync Status</Text>
            <View style={styles.syncRow}>
              <SyncBadge status={visit.syncStatus} />
              {visit.syncStatus === 'failed' && (
                <TouchableOpacity
                  style={[styles.retryButton, { opacity: isRetrying ? 0.6 : 1 }]}
                  onPress={handleRetrySync}
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={16} color="#007AFF" />
                      <Text style={styles.retryText}>Retry</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.editButton, { backgroundColor: '#007AFF' }]}
            onPress={handleEdit}
          >
            <Ionicons name="create" size={18} color="#fff" />
            <Text style={styles.buttonText}>Edit Visit</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 22,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 6,
  },
  retryText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
