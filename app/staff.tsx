import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { TabScreenShell } from '@/components/ui/TabScreenShell';

export default function StaffScreen() {
  const insets = useSafeAreaInsets();

  return (
    <TabScreenShell withNav tabActive="more">
      <View style={[styles.root, { paddingBottom: insets.bottom }]}>
        <ScreenHeader title="স্টাফ" backFallback="/(tabs)/more" />
        <EmptyState
          icon="staff"
          title="শীঘ্রই আসছে"
          subtitle="স্টাফ ম্যানেজমেন্ট ও অনুমতি পরবর্তী আপডেটে যোগ হবে।"
        />
      </View>
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
});
