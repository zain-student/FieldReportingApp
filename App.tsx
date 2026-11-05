import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  Text,
  View,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ComposeScreen from './src/screens/ComposeScreen';
import OutboxScreen from './src/screens/OutboxScreen';
import ServerReportsScreen from './src/screens/ServerReportsScreen';

import { colors } from './src/theme/colors';
import { ensureAnonymousSession } from './src/services/authService';

import {
  startSyncManager,
  stopSyncManager,
} from './src/features/reports/syncManager';

export type MainTabParamList = {
  Compose: undefined;
  Outbox: undefined;
  Server: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const icons = {
  Compose: '+',
  Outbox: '↑',
  Server: '☁',
};

function AppNavigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Compose"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,

          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },

          tabBarStyle: {
            height: 65,
            paddingTop: 7,
            paddingBottom: 7,
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },

          tabBarIcon: ({ color }) => (
            <Text
              style={{
                color,
                fontSize: 22,
                fontWeight: '700',
              }}
            >
              {icons[route.name]}
            </Text>
          ),
        })}
      >
        <Tab.Screen
          name="Compose"
          component={ComposeScreen}
          options={{ tabBarLabel: 'New report' }}
        />

        <Tab.Screen
          name="Outbox"
          component={OutboxScreen}
          options={{ tabBarLabel: 'Outbox' }}
        />

        <Tab.Screen
          name="Server"
          component={ServerReportsScreen}
          options={{ tabBarLabel: 'Server' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function AuthGate() {
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      setAuthError(null);

      await ensureAnonymousSession();
    } catch (error) {
      console.error('Authentication error:', error);

      setAuthError(
        error instanceof Error
          ? error.message
          : 'Unable to connect to Supabase.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  // Start automatic synchronization after authentication succeeds.
  useEffect(() => {
    if (loading || authError) {
      return;
    }

    startSyncManager();

    return () => {
      stopSyncManager();
    };
  }, [loading, authError]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.muted }}>
          Connecting to server...
        </Text>
      </View>
    );
  }

  if (authError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: 'red', textAlign: 'center' }}>{authError}</Text>

        <Pressable
          onPress={initializeAuth}
          style={{
            marginTop: 20,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: colors.primary,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return <AppNavigation />;
}

export default function App() {
  return (
    <SafeAreaProvider
      style={{
        flex: 1,
        backgroundColor: colors.background,
        marginBottom: 50,
      }}
    >
      <StatusBar barStyle="dark-content" />
      <AuthGate />
    </SafeAreaProvider>
  );
}
