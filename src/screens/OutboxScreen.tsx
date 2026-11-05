import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAllReports } from '../features/reports/reportRepository';
import type { ReportRecord } from '../features/reports/types';
import { getLocalImageUri } from '../services/images/imageFileStore';
import { colors } from '../theme/colors';

function getStatusLabel(status: ReportRecord['status']): string {
  switch (status) {
    case 'queued':
      return 'Saved locally · Not uploaded';
    case 'uploading':
      return 'Uploading';
    case 'retry_wait':
      return 'Waiting to retry';
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

function getStatusColor(status: ReportRecord['status']): string {
  switch (status) {
    case 'uploaded':
      return colors.success;
    case 'uploading':
      return colors.primary;
    case 'needs_attention':
      return colors.danger;
    default:
      return colors.warning;
  }
}

export default function OutboxScreen() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(
    null,
  );

  const loadReports = useCallback(() => {
    try {
      const storedReports = getAllReports();
      setReports(storedReports);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load saved reports.',
      );
    }
  }, []);

  // Reload reports whenever the user opens the Outbox tab.
  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    requestAnimationFrame(() => {
      loadReports();
      setRefreshing(false);
    });
  }, [loadReports]);

  const renderReport = ({ item }: { item: ReportRecord }) => (
    <Pressable style={styles.card} onPress={() => setSelectedReport(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.photoCount}>
          {item.images.length} {item.images.length === 1 ? 'photo' : 'photos'}
        </Text>
      </View>

      <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
        {getStatusLabel(item.status)}
      </Text>

      <Text style={styles.date}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>

      <Text style={styles.reportHint}>Tap to view photographs</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>REPORT DELIVERY</Text>
        <Text style={styles.title}>Outbox</Text>
        <Text style={styles.subtitle}>Reports saved on this device.</Text>
        <Text style={styles.total}>{reports.length} saved reports</Text>
      </View>

      {error ? (
        <View style={styles.emptyCard}>
          <Text style={styles.errorTitle}>Unable to load reports</Text>
          <Text style={styles.subtitle}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          renderItem={renderReport}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No saved reports</Text>
              <Text style={styles.subtitle}>
                Reports saved on this device will appear here.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={selectedReport !== null}
        animationType="slide"
        onRequestClose={() => setSelectedReport(null)}
      >
        <SafeAreaView style={styles.detailContainer}>
          {selectedReport && (
            <>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>Report details</Text>
                <Pressable onPress={() => setSelectedReport(null)}>
                  <Text style={styles.closeButton}>Close</Text>
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.detailContent}>
                <Text style={styles.description}>
                  {selectedReport.description}
                </Text>

                <Text
                  style={[
                    styles.status,
                    { color: getStatusColor(selectedReport.status) },
                  ]}
                >
                  {getStatusLabel(selectedReport.status)}
                </Text>

                <Text style={styles.photoCount}>
                  {selectedReport.images.length}{' '}
                  {selectedReport.images.length === 1
                    ? 'photograph'
                    : 'photographs'}
                </Text>

                <Text style={styles.sectionTitle}>Attached photographs</Text>

                <View style={styles.detailPhotoGrid}>
                  {selectedReport.images.map(image => (
                    <View key={image.id} style={styles.detailImageItem}>
                      <Image
                        source={{ uri: getLocalImageUri(image.localPath) }}
                        style={styles.detailImage}
                        resizeMode="contain"
                      />
                    </View>
                  ))}
                </View>
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
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
    color: colors.secondaryText,
    marginTop: 6,
    lineHeight: 20,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  detailHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  detailContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 25,
    marginBottom: 15,
  },
  detailPhotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailImageItem: {
    width: '48%',
    marginBottom: 12,
  },
  detailImage: {
    width: '100%',
    height: 170,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  total: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 12,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  description: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  photoCount: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 10,
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
  date: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 8,
  },
  reportHint: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 5,
  },
  emptyCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 25,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.danger,
  },
});
