import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { BottomNavWithFab } from '@/components/nav/BottomNavWithFab';
import { QuickAddSheet } from '@/components/nav/QuickAddSheet';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { useAuth } from '@/context/AuthContext';
import { resolveActiveTab, TAB_ROUTES, type TabShellActive } from '@/constants/navigation';

import { useUiPreferences } from '@/context/UiPreferencesContext';

export default function TabsLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useAuth();
  const { resolvedTheme: t } = useUiPreferences();
  const [fabOpen, setFabOpen] = useState(false);
  const active = resolveActiveTab(pathname);

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: t.surface }]}>
        <ScreenLoader />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={[styles.root, { backgroundColor: t.surface }]}>
      <Slot />
      <BottomNavWithFab
        active={active}
        fabOpen={fabOpen}
        onTab={(key) => router.replace(TAB_ROUTES[key as TabShellActive] as never)}
        onFab={() => setFabOpen((v) => !v)}
        onFabLongPress={() => router.push('/calculator')}
      />
      <QuickAddSheet visible={fabOpen} onClose={() => setFabOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
