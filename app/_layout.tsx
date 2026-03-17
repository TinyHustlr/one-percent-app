import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useEntriesStore } from '../store/entriesStore';
import { useSquadsStore } from '../store/squadsStore';
import { colors } from '../lib/constants';

export default function RootLayout() {
  const { user, loading, initialize } = useAuthStore();
  const { fetchEntries, fetchTodayEntry } = useEntriesStore();
  const { fetchMySquad } = useSquadsStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (user) {
      fetchEntries(user.id);
      fetchTodayEntry(user.id);
      fetchMySquad(user.id);
    }
  }, [user]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(auth)/reset-password" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
