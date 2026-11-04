import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllReports } from '../reportRepository';
import type { ReportRecord } from '../types';

const colors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#172033',
  secondary: '#64748B',
  border: '#E2E8F0',
  primary: '#3978E8',
};

function getStatusLabel(status: ReportRecord['status']) {
  switch (status) {
    case 'queued':
      return 'Saved locally · Waiting for upload';
    case 'uploading':
      return 'Uploading';
    case 'retry_wait':
      return 'Retry scheduled';
    case 'finalizing':
      return 'Confirming with server';
    case 'uploaded':
      return 'Uploaded and confirmed';
    case 'needs_attention':
      return 'Needs attention';
    default:
      return 'Unknown status';
  }
}

export default function OutboxScreen() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(() => {
    try {
      setError(null);
      setReports(getAllReports());
    } catch {
      setError('Unable to read locally stored reports.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>REPORT DELIVERY</Text>
        <Text style={styles.title}>Outbox</Text>
        <Text style={styles.subtitle}>Reports saved on this device.</Text>
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          onRefresh={loadReports}
          refreshing={false}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No saved reports</Text>
              <Text style={styles.subtitle}>
                Submitted reports will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.reportTitle} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={styles.imageCount}>
                  {item.images.length} photos
                </Text>
              </View>

              <Text style={styles.status}>{getStatusLabel(item.status)}</Text>

              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.primary,
  },
  title: {
    fontSize: 27,
    fontWeight: '700',
    color: colors.text,
    marginTop: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.secondary,
    marginTop: 6,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 25,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  reportTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  imageCount: {
    fontSize: 11,
    color: colors.secondary,
  },
  status: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
  },
  date: {
    fontSize: 11,
    color: colors.secondary,
    marginTop: 7,
  },
  emptyCard: {
    flex: 1,
    minHeight: 180,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 7,
  },
  error: {
    padding: 20,
    color: '#DC2626',
  },
});
