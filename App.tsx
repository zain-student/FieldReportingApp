import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.brand}>FIELD REPORTING</Text>

          <Text style={styles.title}>Field Reporting App</Text>

          <Text style={styles.subtitle}>
            A simple and reliable way to document inspections and submit
            photographs.
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome</Text>

            <Text style={styles.cardDescription}>
              Your reporting workspace is ready. We'll build the report creation
              and offline upload features here.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  brand: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#3978E8',
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#172033',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: '#64748B',
    marginTop: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#172033',
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
    marginTop: 8,
  },
});

export default App;
