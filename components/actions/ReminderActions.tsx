import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { buildReminderSms, reminderSmsUrl } from '@/lib/smsTemplate';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { fonts, spacing, typography } from '@/constants/theme';

interface ReminderActionsProps {
  phone: string | null | undefined;
  partyName: string;
  balance: number;
  shopName: string;
  template: string;
  layout?: 'row' | 'compact';
}

export function ReminderActions({
  phone,
  partyName,
  balance,
  shopName,
  template,
  layout = 'row',
}: ReminderActionsProps) {
  const { resolvedTheme: t } = useUiPreferences();
  if (!phone || balance <= 0) return null;

  const body = buildReminderSms(template, { name: partyName, amount: balance, shop: shopName });

  const run = (action: 'sms' | 'whatsapp') => {
    if (action === 'sms') {
      Linking.openURL(reminderSmsUrl(phone, body));
      return;
    }
    Linking.openURL(
      `whatsapp://send?phone=88${phone.replace(/^0/, '')}&text=${encodeURIComponent(body)}`,
    );
  };

  if (layout === 'compact') {
    return (
      <Pressable onPress={() => run('sms')} style={[styles.compactBtn, { borderRadius: 999, backgroundColor: `${t.brand}18` }]}>
        <Text style={[styles.compactText, { color: t.brand }]}>মনে করান</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.row}>
      <Button label="SMS" variant="outline" onPress={() => run('sms')} style={{ flex: 1 }} />
      <Button label="WhatsApp" variant="outline" onPress={() => run('whatsapp')} style={{ flex: 1 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  compactBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  compactText: { ...typography.caption, fontFamily: fonts.bengaliSemiBold },
});
