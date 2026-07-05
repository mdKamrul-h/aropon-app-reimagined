import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { PaywallModal } from '@/components/premium/PaywallModal';
import { usePremium } from '@/context/PremiumContext';
import { buildReminderSms, reminderSmsUrl } from '@/lib/smsTemplate';
import { colors, fonts, radius, spacing, typography } from '@/constants/theme';

interface PremiumReminderActionsProps {
  phone: string | null | undefined;
  partyName: string;
  balance: number;
  shopName: string;
  template: string;
  layout?: 'row' | 'compact';
}

export function PremiumReminderActions({
  phone,
  partyName,
  balance,
  shopName,
  template,
  layout = 'row',
}: PremiumReminderActionsProps) {
  const { isPremium } = usePremium();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'sms' | 'whatsapp' | null>(null);

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

  const request = (action: 'sms' | 'whatsapp') => {
    if (isPremium) {
      run(action);
      return;
    }
    setPendingAction(action);
    setPaywallOpen(true);
  };

  if (layout === 'compact') {
    return (
      <>
        <Pressable onPress={() => request('sms')} style={styles.compactBtn}>
          <Text style={styles.compactText}>
            মনে করান {!isPremium ? '🔒' : ''}
          </Text>
        </Pressable>
        <PaywallModal
          visible={paywallOpen}
          onClose={() => {
            setPaywallOpen(false);
            setPendingAction(null);
          }}
          onUnlocked={() => {
            if (pendingAction) run(pendingAction);
            setPendingAction(null);
          }}
          feature="reminder"
        />
      </>
    );
  }

  return (
    <>
      <View style={styles.row}>
        <Button
          label={isPremium ? 'SMS' : 'SMS 🔒'}
          variant="outline"
          onPress={() => request('sms')}
          style={{ flex: 1 }}
        />
        <Button
          label={isPremium ? 'WhatsApp' : 'WhatsApp 🔒'}
          variant="outline"
          onPress={() => request('whatsapp')}
          style={{ flex: 1 }}
        />
      </View>
      <PaywallModal
        visible={paywallOpen}
        onClose={() => {
          setPaywallOpen(false);
          setPendingAction(null);
        }}
        onUnlocked={() => {
          if (pendingAction) run(pendingAction);
          setPendingAction(null);
        }}
        feature="reminder"
      />
    </>
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
