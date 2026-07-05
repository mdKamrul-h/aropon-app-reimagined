import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { TabScreenShell } from '@/components/ui/TabScreenShell';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { fonts, spacing, typography } from '@/constants/theme';

const FAQ = [
  { q: 'কিভাবে নতুন বিক্রি রেকর্ড করব?', a: 'নিচের + বাটনে চাপ দিয়ে "নতুন বিক্রি" বেছে নিন।' },
  { q: 'বাকি কিভাবে দেখব?', a: 'খাতা মেনু থেকে গ্রাহক তালিকা দেখুন।' },
  { q: 'দিন শেষের হিসাব কোথায়?', a: 'হিসাব ট্যাব → দিন শেষের হিসাব মিলান।' },
];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const { resolvedTheme: t } = useUiPreferences();

  return (
    <TabScreenShell withNav tabActive="more">
      <View style={[styles.root, { paddingBottom: insets.bottom }]}>
        <ScreenHeader title="সাহায্য" backFallback="/(tabs)/more" />
        <ScrollView contentContainerStyle={styles.content}>
          {FAQ.map((item) => (
            <SurfaceCard key={item.q} style={styles.card}>
              <Text style={[styles.q, { color: t.ink }]}>{item.q}</Text>
              <Text style={[styles.a, { color: t.mutedDark }]}>{item.a}</Text>
            </SurfaceCard>
          ))}
          <Text
            style={[styles.support, { color: t.brand }]}
            onPress={() => Linking.openURL('mailto:support@aropon.app')}
          >
            সাপোর্ট: support@aropon.app
          </Text>
        </ScrollView>
      </View>
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { gap: spacing.xs },
  q: { ...typography.body, fontFamily: fonts.bengaliSemiBold },
  a: { ...typography.bodySm, lineHeight: 22 },
  support: { ...typography.body, textAlign: 'center', marginTop: spacing.lg },
});
