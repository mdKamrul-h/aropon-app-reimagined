import { useCallback, useEffect, useState } from 'react';
import { Platform, Switch, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ListRow } from '@/components/ui/ListRow';
import { PaywallModal } from '@/components/premium/PaywallModal';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { TabScreenShell } from '@/components/ui/TabScreenShell';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { usePremium } from '@/context/PremiumContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import {
  getNotificationPref,
  setNotificationPref,
  type NotificationPrefKey,
} from '@/lib/notifications';
import type { Language } from '@/types/schema';
import { colors, fonts, radius, spacing, typography } from '@/constants/theme';

const NOTIF_TOGGLES: { key: NotificationPrefKey; label: string }[] = [
  { key: 'kisti', label: 'কিস্তি সতর্কতা' },
  { key: 'lowStock', label: 'কম স্টক সতর্কতা' },
  { key: 'dayClose', label: 'দিন শেষ রিমাইন্ডার (৯টা)' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { business, language, setLanguage, profile } = useAuth();
  const { repo } = useRepository();
  const { showSuccess } = useToast();
  const { isPremium } = usePremium();
  const { preferences, setPreference, resolvedTheme: t } = useUiPreferences();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [template, setTemplate] = useState(business?.reminder_sms_template ?? '');
  const [saving, setSaving] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<Record<NotificationPrefKey, boolean>>({
    kisti: true,
    lowStock: true,
    dayClose: true,
  });

  const loadPrefs = useCallback(async () => {
    const entries = await Promise.all(
      NOTIF_TOGGLES.map(async (item) => [item.key, await getNotificationPref(item.key)] as const),
    );
    setNotifPrefs(Object.fromEntries(entries) as Record<NotificationPrefKey, boolean>);
  }, []);

  useEffect(() => {
    void loadPrefs();
  }, [loadPrefs]);

  useEffect(() => {
    if (business?.reminder_sms_template) setTemplate(business.reminder_sms_template);
  }, [business?.reminder_sms_template]);

  const saveTemplate = async () => {
    if (!business) return;
    if (!isPremium) {
      setPaywallOpen(true);
      return;
    }
    setSaving(true);
    await repo.updateBusiness(business.id, { reminder_sms_template: template });
    showSuccess('টেমপ্লেট সংরক্ষিত');
    setSaving(false);
  };

  const pickLang = async (lang: Language) => {
    setLanguage(lang);
    if (profile) {
      await repo.upsertProfile({ ...profile, language: lang });
    }
    await repo.setLanguage?.(lang);
    showSuccess('ভাষা পরিবর্তন হয়েছে');
  };

  const toggleNotif = async (key: NotificationPrefKey, value: boolean) => {
    setNotifPrefs((p) => ({ ...p, [key]: value }));
    await setNotificationPref(key, value);
  };

  return (
    <TabScreenShell withNav tabActive="more">
      <ScreenHeader title="সেটিংস" backFallback="/(tabs)/more" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        <SurfaceCard style={styles.card}>
          <Text style={[styles.section, { color: t.muted, marginTop: 0 }]}>থিম</Text>
          <View style={styles.row}>
            {([
              { key: 'system', label: 'সিস্টেম' },
              { key: 'light', label: 'হালকা' },
              { key: 'dark', label: 'গাঢ়' },
            ] as const).map((opt) => (
              <Pressable
                key={opt.key}
                style={[
                  styles.chip,
                  { borderColor: t.border },
                  (preferences.themePreference ?? 'system') === opt.key && {
                    borderColor: t.brand,
                    backgroundColor: `${t.brand}10`,
                  },
                ]}
                onPress={() => setPreference('themePreference', opt.key)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: t.mutedDark },
                    (preferences.themePreference ?? 'system') === opt.key && {
                      color: t.brand,
                      fontFamily: fonts.bengaliSemiBold,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.card}>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: t.ink }]}>ডার্ক মোড (দ্রুত)</Text>
            <Switch
              value={preferences.colorScheme === 'dark'}
              onValueChange={(v) => {
                setPreference('themePreference', v ? 'dark' : 'light');
                setPreference('colorScheme', v ? 'dark' : 'light');
              }}
              trackColor={{ true: t.brand, false: t.border }}
            />
          </View>
        </SurfaceCard>

        <Text style={[styles.section, { color: t.muted }]}>SMS টেমপ্লেট {!isPremium ? '🔒 প্রিমিয়াম' : ''}</Text>
        <TextInput
          style={[styles.textarea, { borderColor: t.border, color: t.ink, backgroundColor: t.card }, !isPremium && styles.textareaLocked]}
          multiline
          value={template}
          onChangeText={setTemplate}
          placeholder="{{name}}, {{amount}}, {{shop}}"
          editable={isPremium}
        />
        <Button
          label={isPremium ? 'সংরক্ষণ করুন' : 'প্রিমিয়ামে আনলক করুন'}
          onPress={saveTemplate}
          loading={saving}
        />
        <PaywallModal visible={paywallOpen} onClose={() => setPaywallOpen(false)} feature="reminder" />

        <Text style={[styles.section, { color: t.muted }]}>ভাষা</Text>
        <View style={styles.row}>
          {(['bn', 'en'] as Language[]).map((l) => (
            <Pressable
              key={l}
              style={[styles.chip, { borderColor: t.border }, language === l && { borderColor: t.brand, backgroundColor: `${t.brand}10` }]}
              onPress={() => pickLang(l)}
            >
              <Text style={[styles.chipText, { color: t.mutedDark }, language === l && { color: t.brand, fontFamily: fonts.bengaliSemiBold }]}>
                {l === 'bn' ? 'বাংলা' : 'English'}
              </Text>
            </Pressable>
          ))}
        </View>

        {Platform.OS !== 'web' ? (
          <>
            <Text style={[styles.section, { color: t.muted }]}>বিজ্ঞপ্তি</Text>
            {NOTIF_TOGGLES.map((item) => (
              <View key={item.key} style={[styles.toggleRow, { backgroundColor: t.card }]}>
                <Text style={[styles.toggleLabel, { color: t.ink }]}>{item.label}</Text>
                <Switch
                  value={notifPrefs[item.key]}
                  onValueChange={(v) => void toggleNotif(item.key, v)}
                  trackColor={{ true: t.brand, false: t.border }}
                />
              </View>
            ))}
          </>
        ) : null}

        <Text style={[styles.section, { color: t.muted }]}>অন্যান্য</Text>
        <SurfaceCard style={styles.linksCard} padded={false}>
          {[
            { label: 'প্রোফাইল', route: '/profile' },
            { label: 'ব্যাকআপ', route: '/backup' },
            { label: 'সাহায্য', route: '/help' },
          ].map((item) => (
            <ListRow
              key={item.route}
              label={item.label}
              onPress={() => router.push(item.route as never)}
              showChevron
              haptic
            />
          ))}
        </SurfaceCard>
      </ScrollView>
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  card: { padding: 0 },
  section: { ...typography.label, marginTop: spacing.sm },
  textarea: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
  },
  textareaLocked: { opacity: 0.7 },
  row: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { ...typography.bodySm },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  toggleLabel: { ...typography.body, flex: 1 },
  linksCard: { padding: 0, overflow: 'hidden' },
});
