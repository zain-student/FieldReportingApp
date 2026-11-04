// import React from 'react';
// import { StyleSheet, Text, View } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { colors } from '../theme/colors';

// export default function OutboxScreen() {
//   return (
//     <SafeAreaView style={styles.container} edges={['top']}>
//       <View style={styles.content}>
//         <Text style={styles.eyebrow}>REPORT DELIVERY</Text>
//         <Text style={styles.title}>Outbox</Text>

//         <Text style={styles.subtitle}>
//           Reports saved on this device and their delivery status.
//         </Text>

//         <View style={styles.emptyCard}>
//           <Text style={styles.emptyTitle}>No saved reports</Text>
//           <Text style={styles.subtitle}>
//             Your submitted reports will appear here.
//           </Text>
//         </View>

//         <View style={styles.statusCard}>
//           <Text style={styles.statusTitle}>Delivery status guide</Text>

//           <Text style={styles.status}>● Waiting for network</Text>
//           <Text style={styles.uploading}>● Uploading</Text>
//           <Text style={styles.success}>● Uploaded and confirmed</Text>
//           <Text style={styles.failed}>● Needs attention</Text>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.background,
//   },
//   content: {
//     flex: 1,
//     padding: 20,
//   },
//   eyebrow: {
//     fontSize: 11,
//     fontWeight: '700',
//     letterSpacing: 1.5,
//     color: colors.primary,
//   },
//   title: {
//     fontSize: 27,
//     fontWeight: '700',
//     color: colors.text,
//     marginTop: 6,
//   },
//   subtitle: {
//     fontSize: 13,
//     color: colors.secondaryText,
//     marginTop: 6,
//     lineHeight: 20,
//   },
//   emptyCard: {
//     backgroundColor: colors.surface,
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: colors.border,
//     padding: 25,
//     alignItems: 'center',
//     marginTop: 30,
//   },
//   emptyTitle: {
//     fontSize: 17,
//     fontWeight: '700',
//     color: colors.text,
//   },
//   statusCard: {
//     backgroundColor: colors.surface,
//     borderRadius: 14,
//     borderWidth: 1,
//     borderColor: colors.border,
//     padding: 18,
//     marginTop: 20,
//     gap: 13,
//   },
//   statusTitle: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: colors.text,
//     marginBottom: 3,
//   },
//   status: {
//     color: colors.warning,
//     fontSize: 13,
//   },
//   uploading: {
//     color: colors.primary,
//     fontSize: 13,
//   },
//   success: {
//     color: colors.success,
//     fontSize: 13,
//   },
//   failed: {
//     color: colors.danger,
//     fontSize: 13,
//   },
// });

import React, { useCallback, useState } from 'react';

import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAllReports } from '../features/reports/reportRepository';
import type { ReportRecord } from '../features/reports/types';
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

  const loadReports = useCallback(() => {
    try {
      const storedReports = getAllReports();

      setReports(storedReports);
      setError(null);

      console.log('[OUTBOX] Reports loaded:', storedReports.length);
    } catch (err) {
      console.error('[OUTBOX] Failed to load reports:', err);

      setError(
        err instanceof Error ? err.message : 'Unable to load saved reports.',
      );
    }
  }, []);

  // Reload whenever the user opens the Outbox tab.
  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports();
    setRefreshing(false);
  };

  const renderReport = ({ item }: { item: ReportRecord }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.description}>{item.description}</Text>

        <View
          style={[
            styles.statusDot,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        />
      </View>

      <Text style={styles.photoCount}>{item.images.length} photographs</Text>

      <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
        {getStatusLabel(item.status)}
      </Text>

      <Text style={styles.date}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>

      <Text style={styles.reportId}>Report ID: {item.id}</Text>
    </View>
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

  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginLeft: 10,
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

  reportId: {
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
