import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';
import { useAuthStore } from '../store/authStore';
import { Icon } from '../components/Icon';

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

function GlassTabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  return (
    <View style={[
      tabStyles.iconWrap,
      focused && tabStyles.iconWrapActive,
    ]}>
      {/* Inner top highlight — mimics Apple liquid glass refraction */}
      {focused && <View style={tabStyles.innerHighlight} />}
      <Icon name={focused ? name.replace('-outline', '') : name} size={20} color={color} />
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    width: 48,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 1,
  },
});

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(10, 5, 21, 0.92)',
          borderTopColor: 'rgba(139, 92, 246, 0.15)',
          borderTopWidth: 0.5,
          paddingTop: 4,
          height: 90,
        },
        tabBarActiveTintColor: colors.primaryLight,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="AlarmsTab"
        component={AlarmStack}
        options={{
          title: 'Alarms',
          tabBarIcon: ({ color, focused }) => (
            <GlassTabIcon name="alarm-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="StatsTab"
        component={StatsStack}
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, focused }) => (
            <GlassTabIcon name="stats-chart-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="SocialTab"
        component={SocialStack}
        options={{
          title: 'Social',
          tabBarIcon: ({ color, focused }) => (
            <GlassTabIcon name="people-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <GlassTabIcon name="person-outline" color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [hasOnboarded, setHasOnboarded] = React.useState(true); // TODO: set back to false for production

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
