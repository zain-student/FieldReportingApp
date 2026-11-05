// import React from 'react';
// import { StyleSheet, Text, View } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { colors } from '../theme/colors';

// export default function ServerReportsScreen() {
//   return (
//     <SafeAreaView style={styles.container} edges={['top']}>
//       <View style={styles.content}>
//         <Text style={styles.eyebrow}>REMOTE RECORDS</Text>

//         <Text style={styles.title}>Server reports</Text>

//         <Text style={styles.subtitle}>
//           Reports confirmed by the remote server.
//         </Text>

//         <View style={styles.emptyCard}>
//           <Text style={styles.cloudIcon}>☁</Text>

//           <Text style={styles.emptyTitle}>Backend not connected</Text>

//           <Text style={styles.subtitle}>
//             Once Supabase Emulator is connected, reports fetched directly from
//             the server will appear here.
//           </Text>
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
//     lineHeight: 20,
//     marginTop: 6,
//   },
//   emptyCard: {
//     backgroundColor: colors.surface,
//     borderWidth: 1,
//     borderColor: colors.border,
//     borderRadius: 16,
//     padding: 25,
//     alignItems: 'center',
//     marginTop: 30,
//   },
//   cloudIcon: {
//     fontSize: 42,
//     color: colors.primary,
//     marginBottom: 15,
//   },
//   emptyTitle: {
//     fontSize: 17,
//     fontWeight: '700',
//     color: colors.text,
//   },
// });

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../services/supabase';
import { colors } from '../theme/colors';

const BUCKET_NAME = 'report-images';

interface ServerImage {
  id: string;
  storage_path: string;
  signedUrl: string;
}

interface ServerReport {
  id: string;
  description: string;
  created_at: string;
  client_created_at: string;
  report_images: ServerImage[];
}

interface DatabaseImage {
  id: string;
  storage_path: string;
}

interface DatabaseReport {
  id: string;
  description: string;
  created_at: string;
  client_created_at: string;
  report_images: DatabaseImage[] | null;
}

export default function ServerReportsScreen() {
  const [reports, setReports] = useState<ServerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadServerReports = useCallback(async () => {
    try {
      setError(null);

      const { data, error: queryError } = await supabase
        .from('reports')
        .select(
          `
          id,
          description,
          created_at,
          client_created_at,
          report_images (
            id,
            storage_path
          )
        `,
        )
        .eq('sync_status', 'uploaded')
        .order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      const databaseReports = (data ?? []) as DatabaseReport[];

      const formattedReports: ServerReport[] = await Promise.all(
        databaseReports.map(async report => {
          const images = await Promise.all(
            (report.report_images ?? []).map(async image => {
              const { data: signedData, error: signedError } =
                await supabase.storage
                  .from(BUCKET_NAME)
                  .createSignedUrl(image.storage_path, 3600);

              if (signedError) {
                console.warn(
                  'Unable to generate photograph URL:',
                  signedError.message,
                );

                return null;
              }

              return {
                id: image.id,
                storage_path: image.storage_path,
                signedUrl: signedData.signedUrl,
              };
            }),
          );

          return {
            id: report.id,
            description: report.description,
            created_at: report.created_at,
            client_created_at: report.client_created_at,
            report_images: images.filter(
              (image): image is ServerImage => image !== null,
            ),
          };
        }),
      );

      setReports(formattedReports);
    } catch (err) {
      console.error('Server reports error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to fetch reports from the server.',
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchReports = async () => {
        setLoading(true);
        await loadServerReports();
        if (isActive) {
          setLoading(false);
        }
      };

      fetchReports();

      return () => {
        isActive = false;
      };
    }, [loadServerReports]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadServerReports();
    setRefreshing(false);
  }, [loadServerReports]);

  const renderReport = ({ item }: { item: ServerReport }) => (
    <View style={styles.card}>
      <Text style={styles.description}>{item.description}</Text>

      <Text style={styles.status}>Uploaded and confirmed</Text>

      <Text style={styles.date}>
        {new Date(item.client_created_at).toLocaleString()}
      </Text>

      <Text style={styles.photoCount}>
        {item.report_images.length}{' '}
        {item.report_images.length === 1 ? 'photograph' : 'photographs'}
      </Text>

      {item.report_images.length > 0 && (
        <View style={styles.photoGrid}>
          {item.report_images.map(image => (
            <Image
              key={image.id}
              source={{ uri: image.signedUrl }}
              style={styles.reportImage}
              resizeMode="cover"
            />
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>REMOTE RECORDS</Text>

        <Text style={styles.title}>Server reports</Text>

        <Text style={styles.subtitle}>
          Reports fetched directly from Supabase.
        </Text>

        <Text style={styles.total}>{reports.length} server reports</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.subtitle}>Fetching server reports...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyCard}>
          <Text style={styles.errorTitle}>Unable to load server reports</Text>
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
              <Text style={styles.cloudIcon}>☁</Text>
              <Text style={styles.emptyTitle}>No server reports yet</Text>
              <Text style={styles.subtitle}>
                Confirmed reports will appear here after successful uploads.
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
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  total: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
    marginTop: 10,
  },
  date: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 8,
  },
  photoCount: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 10,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  reportImage: {
    width: '48%',
    height: 140,
    borderRadius: 10,
    backgroundColor: colors.border,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  cloudIcon: {
    fontSize: 42,
    color: colors.primary,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.danger,
    textAlign: 'center',
  },
});
