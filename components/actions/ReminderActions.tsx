import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { buildReminderSms, reminderSmsUrl } from '@/lib/smsTemplate';
import { colors, fonts, radius, spacing, typography } from '@/constants/theme';

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
      <Pressable onPress={() => run('sms')} style={styles.compactBtn}>
        <Text style={styles.compactText}>মনে করান</Text>
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
    borderRadius: radius.pill,
    backgroundColor: colors.chip,
  },
  compactText: { ...typography.caption, color: colors.brand, fontFamily: fonts.bengaliSemiBold },
});
