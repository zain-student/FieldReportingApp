import React from 'react';
import { StatusBar, Text } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ComposeScreen from './src/screens/ComposeScreen';
import OutboxScreen from './src/screens/OutboxScreen';
import ServerReportsScreen from './src/screens/ServerReportsScreen';

import { colors } from './src/theme/colors';

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

export default function App() {
  return (
    <SafeAreaProvider
      style={{ flex: 1, backgroundColor: colors.background, marginBottom: 50 }}
    >
      <StatusBar barStyle="dark-content" />
      <AppNavigation />
    </SafeAreaProvider>
  );
}
