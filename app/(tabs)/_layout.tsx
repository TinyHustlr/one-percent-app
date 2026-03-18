import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function TabsLayout() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const { theme } = useThemeStore();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, loading]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.gray,
        tabBarStyle: {
          backgroundColor: theme.white,
          borderTopColor: theme.lightGray,
        },
        headerStyle: {
          backgroundColor: theme.white,
        },
        headerTitleStyle: {
          color: theme.dark,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarLabel: 'Today',
        }}
      />
      <Tabs.Screen
        name="squads"
        options={{
          title: 'Squad',
          tabBarLabel: 'Squad',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarLabel: 'History',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}
