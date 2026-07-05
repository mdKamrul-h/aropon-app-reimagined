import { Stack } from 'expo-router';
import { useUiPreferences } from '@/context/UiPreferencesContext';

export function AppStack() {
  const { resolvedTheme } = useUiPreferences();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: resolvedTheme.surface },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="transaction" options={{ presentation: 'modal' }} />
      <Stack.Screen name="calculator" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="khata" options={{ presentation: 'card' }} />
      <Stack.Screen name="ledger" options={{ presentation: 'card' }} />
      <Stack.Screen name="baki-khata" options={{ presentation: 'card' }} />
      <Stack.Screen name="stock-khata" options={{ presentation: 'card' }} />
      <Stack.Screen name="party/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="party/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="product/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="product/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="loan/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="loan/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="loans" options={{ presentation: 'card' }} />
      <Stack.Screen name="reports" options={{ presentation: 'card' }} />
      <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
      <Stack.Screen name="settings" options={{ presentation: 'card' }} />
      <Stack.Screen name="profile" options={{ presentation: 'card' }} />
      <Stack.Screen name="learning" options={{ presentation: 'card' }} />
      <Stack.Screen name="credit-score" options={{ presentation: 'card', animation: 'fade_from_bottom' }} />
      <Stack.Screen name="help" options={{ presentation: 'card' }} />
      <Stack.Screen name="backup" options={{ presentation: 'card' }} />
      <Stack.Screen name="staff" options={{ presentation: 'card' }} />
    </Stack>
  );
}
