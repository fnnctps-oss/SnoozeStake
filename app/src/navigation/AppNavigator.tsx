import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { colors } from '../utils/theme';
import { useAuthStore } from '../store/authStore';

// Screens
import { AlarmListScreen } from '../screens/AlarmListScreen';
import { CreateAlarmScreen } from '../screens/CreateAlarmScreen';
import { AlarmRingingScreen } from '../screens/AlarmRingingScreen';
import { WakeUpTaskScreen } from '../screens/WakeUpTaskScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SocialFeedScreen } from '../screens/SocialFeedScreen';
import { BattleListScreen } from '../screens/BattleListScreen';
import { GroupListScreen } from '../screens/GroupListScreen';
import { FriendListScreen } from '../screens/FriendListScreen';
import { CharityScreen } from '../screens/CharityScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ReferralScreen } from '../screens/ReferralScreen';
import { ShareCardScreen } from '../screens/ShareCardScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AlarmStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="AlarmList" component={AlarmListScreen} options={{ title: 'Alarms' }} />
      <Stack.Screen name="CreateAlarm" component={CreateAlarmScreen} options={{ title: 'New Alarm' }} />
      <Stack.Screen
        name="AlarmRinging"
        component={AlarmRingingScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="WakeUpTask"
        component={WakeUpTaskScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}

function StatsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Stats' }} />
      <Stack.Screen name="Charity" component={CharityScreen} options={{ title: 'Charities' }} />
    </Stack.Navigator>
  );
}

function SocialStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="SocialFeed" component={SocialFeedScreen} options={{ title: 'Social' }} />
      <Stack.Screen name="Battles" component={BattleListScreen} options={{ title: 'Battles' }} />
      <Stack.Screen name="Groups" component={GroupListScreen} options={{ title: 'Groups' }} />
      <Stack.Screen name="Friends" component={FriendListScreen} options={{ title: 'Friends' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: 'Wallet' }} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ title: 'Achievements' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Referral" component={ReferralScreen} options={{ title: 'Refer a Friend' }} />
      <Stack.Screen name="ShareCard" component={ShareCardScreen} options={{ title: 'Share Card' }} />
    </Stack.Navigator>
  );
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ color: focused ? colors.primary : colors.textMuted, fontSize: 20 }}>
      {label}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="AlarmsTab"
        component={AlarmStack}
        options={{
          title: 'Alarms',
          tabBarIcon: ({ focused }) => <TabIcon label="⏰" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="StatsTab"
        component={StatsStack}
        options={{
          title: 'Stats',
          tabBarIcon: ({ focused }) => <TabIcon label="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SocialTab"
        component={SocialStack}
        options={{
          title: 'Social',
          tabBarIcon: ({ focused }) => <TabIcon label="👥" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [hasOnboarded, setHasOnboarded] = React.useState(false);

  if (isAuthenticated && !hasOnboarded) {
    return (
      <NavigationContainer>
        <OnboardingScreen onComplete={() => setHasOnboarded(true)} />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
