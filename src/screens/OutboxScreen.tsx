import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export default function OutboxScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>REPORT DELIVERY</Text>
        <Text style={styles.title}>Outbox</Text>

        <Text style={styles.subtitle}>
          Reports saved on this device and their delivery status.
        </Text>

        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No saved reports</Text>
          <Text style={styles.subtitle}>
            Your submitted reports will appear here.
          </Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Delivery status guide</Text>

          <Text style={styles.status}>● Waiting for network</Text>
          <Text style={styles.uploading}>● Uploading</Text>
          <Text style={styles.success}>● Uploaded and confirmed</Text>
          <Text style={styles.failed}>● Needs attention</Text>
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
    marginTop: 6,
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 25,
    alignItems: 'center',
    marginTop: 30,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginTop: 20,
    gap: 13,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 3,
  },
  status: {
    color: colors.warning,
    fontSize: 13,
  },
  uploading: {
    color: colors.primary,
    fontSize: 13,
  },
  success: {
    color: colors.success,
    fontSize: 13,
  },
  failed: {
    color: colors.danger,
    fontSize: 13,
  },
});
