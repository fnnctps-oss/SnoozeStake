import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { colors } from '../utils/theme';
import { useAuthStore } from '../store/authStore';
import { useAlarmStore } from '../store/alarmStore';
import { Icon } from '../components/Icon';
import { requestAllPermissions } from '../services/permissions';

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
import { CreateBattleScreen } from '../screens/CreateBattleScreen';
import { BattleDetailScreen } from '../screens/BattleDetailScreen';
import { GroupDetailScreen } from '../screens/GroupDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const stackScreenOptions = {
  headerStyle: {
    backgroundColor: 'rgba(10, 5, 21, 0.95)',
  },
  headerShadowVisible: false,
  headerTintColor: colors.text,
  contentStyle: { backgroundColor: colors.background },
};

function AlarmStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
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
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Stats' }} />
      <Stack.Screen name="Charity" component={CharityScreen} options={{ title: 'Charities' }} />
    </Stack.Navigator>
  );
}

function SocialStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="SocialFeed" component={SocialFeedScreen} options={{ title: 'Social' }} />
      <Stack.Screen name="Battles" component={BattleListScreen} options={{ title: 'Battles' }} />
      <Stack.Screen name="Groups" component={GroupListScreen} options={{ title: 'Groups' }} />
      <Stack.Screen name="Friends" component={FriendListScreen} options={{ title: 'Friends' }} />
      <Stack.Screen name="CreateBattle" component={CreateBattleScreen} options={{ title: 'New Battle' }} />
      <Stack.Screen name="BattleDetail" component={BattleDetailScreen} options={{ title: 'Battle' }} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: 'Group' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: 'Wallet' }} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ title: 'Achievements' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Referral" component={ReferralScreen} options={{ title: 'Refer a Friend' }} />
      <Stack.Screen name="ShareCard" component={ShareCardScreen} options={{ title: 'Share Card' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(12, 6, 24, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(139, 92, 246, 0.12)',
          height: 85,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarActiveTintColor: colors.primaryLight,
        tabBarInactiveTintColor: 'rgba(160, 160, 190, 0.5)',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tab.Screen
        name="AlarmsTab"
        component={AlarmStack}
        options={{
          title: 'Alarms',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? 'alarm' : 'alarm-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="StatsTab"
        component={StatsStack}
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? 'stats-chart' : 'stats-chart-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SocialTab"
        component={SocialStack}
        options={{
          title: 'Social',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? 'people' : 'people-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [hasOnboarded, setHasOnboarded] = React.useState(true); // TODO: set back to false for production
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const alarms = useAlarmStore((s) => s.alarms);

  // Request all permissions on mount (notifications, motion/pedometer)
  useEffect(() => {
    requestAllPermissions();
  }, []);

  // Handle notification taps → navigate to AlarmRinging screen
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'alarm' && data?.alarmId) {
        // Find the alarm in our store
        const alarm = alarms.find((a) => a.id === data.alarmId);
        if (alarm && navigationRef.current) {
          // Navigate to AlarmRinging inside the Alarms tab
          // Pass snoozeCount and totalPenalty from notification data (for re-snooze)
          navigationRef.current.navigate('AlarmsTab', {
            screen: 'AlarmRinging',
            params: {
              alarm,
              snoozeCount: data.snoozeCount || 0,
              totalPenalty: data.totalPenalty || 0,
            },
          });
        }
      }
    });

    return () => subscription.remove();
  }, [alarms]);

  if (isAuthenticated && !hasOnboarded) {
    return (
      <NavigationContainer ref={navigationRef}>
        <OnboardingScreen onComplete={() => setHasOnboarded(true)} />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
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
