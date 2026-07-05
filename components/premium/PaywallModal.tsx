import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { usePremium } from '@/context/PremiumContext';
import { colors, radius, spacing, typography } from '@/constants/theme';

type PaywallFeature = 'export' | 'reminder';

const COPY: Record<
  PaywallFeature,
  { title: string; desc: string; features: string[] }
> = {
  export: {
    title: 'প্রিমিয়াম রিপোর্ট',
    desc: 'Excel ও PDF হিসাবে রিপোর্ট ডাউনলোড করুন।',
    features: ['Excel (CSV) এক্সপোর্ট', 'PDF রিপোর্ট', 'সাপ্তাহিক / মাসিক / বার্ষিক'],
  },
  reminder: {
    title: 'প্রিমিয়াম রিমাইন্ডার',
    desc: 'SMS, WhatsApp ও বাকি মনে করানোর সব সুবিধা।',
    features: ['SMS রিমাইন্ডার', 'WhatsApp মেসেজ', 'কাস্টম SMS টেমপ্লেট'],
  },
};

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onUnlocked?: () => void;
  feature?: PaywallFeature;
}

export function PaywallModal({
  visible,
  onClose,
  onUnlocked,
  feature = 'export',
}: PaywallModalProps) {
  const insets = useSafeAreaInsets();
  const { unlock } = usePremium();
  const [step, setStep] = useState(0);
  const copy = COPY[feature];

  const complete = async () => {
    await unlock();
    onUnlocked?.();
    onClose();
    setStep(0);
  };

  const handleClose = () => {
    setStep(0);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.price}>৳৯৯ / মাস</Text>
          <Text style={styles.desc}>{copy.desc}</Text>

          {step === 0 ? (
            <>
              <View style={styles.feature}>
                {copy.features.map((f) => (
                  <Text key={f} style={styles.featureText}>
                    ✓ {f}
                  </Text>
                ))}
              </View>
              <Button label="bKash দিয়ে পেমেন্ট করুন" onPress={() => setStep(1)} />
            </>
          ) : (
            <>
              <Text style={styles.bkash}>bKash: ০১৭XXXXXXXX</Text>
              <Text style={styles.hint}>রেফারেন্স: Aropon Premium</Text>
              <Button label="পেমেন্ট সম্পন্ন" onPress={complete} />
              <Button
                label="পেছনে"
                variant="outline"
                onPress={() => setStep(0)}
                style={{ marginTop: spacing.sm }}
              />
            </>
          )}

          <Pressable onPress={handleClose} style={styles.close}>
            <Text style={styles.closeText}>বাতিল</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  title: { ...typography.screenTitle, color: colors.ink, textAlign: 'center' },
  price: {
    ...typography.heroAmount,
    fontSize: 36,
    lineHeight: 44,
    color: colors.brand,
    textAlign: 'center',
  },
  desc: { ...typography.bodySm, color: colors.muted, textAlign: 'center' },
  feature: { gap: spacing.sm, backgroundColor: colors.chip, padding: spacing.lg, borderRadius: radius.lg },
  featureText: { ...typography.bodySm, color: colors.ink },
  bkash: { ...typography.sectionTitle, color: colors.ink, textAlign: 'center' },
  hint: { ...typography.caption, color: colors.muted, textAlign: 'center' },
  close: { alignItems: 'center', paddingTop: spacing.sm },
  closeText: { ...typography.bodySm, color: colors.muted },
});
