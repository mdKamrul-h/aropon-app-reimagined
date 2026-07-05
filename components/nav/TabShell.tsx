import { useState, type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomNavWithFab } from '@/components/nav/BottomNavWithFab';
import { QuickAddSheet } from '@/components/nav/QuickAddSheet';
import { TAB_ROUTES, type TabShellActive } from '@/constants/navigation';
import { useUiPreferences } from '@/context/UiPreferencesContext';

export type { TabShellActive };

interface TabShellProps {
  children: ReactNode;
  active: TabShellActive;
}

export function TabShell({ children, active }: TabShellProps) {
  const router = useRouter();
  const [fabOpen, setFabOpen] = useState(false);
  const { resolvedTheme: t } = useUiPreferences();

  return (
    <View style={[styles.root, { backgroundColor: t.surface }]}>
      <View style={styles.content}>{children}</View>
      <BottomNavWithFab
        active={active}
        onTab={(key) => router.replace(TAB_ROUTES[key as TabShellActive] as never)}
        onFab={() => setFabOpen(true)}
        onFabLongPress={() => router.push('/calculator')}
        fabOpen={fabOpen}
      />
      <QuickAddSheet visible={fabOpen} onClose={() => setFabOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
