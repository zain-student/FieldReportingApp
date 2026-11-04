import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export default function ServerReportsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>REMOTE RECORDS</Text>

        <Text style={styles.title}>Server reports</Text>

        <Text style={styles.subtitle}>
          Reports confirmed by the remote server.
        </Text>

        <View style={styles.emptyCard}>
          <Text style={styles.cloudIcon}>☁</Text>

          <Text style={styles.emptyTitle}>Backend not connected</Text>

          <Text style={styles.subtitle}>
            Once Firebase Emulator is connected, reports fetched directly from
            the server will appear here.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
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
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    marginTop: 30,
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
  },
});
