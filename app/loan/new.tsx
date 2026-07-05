import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AppScreenShell } from '@/components/layout/AppScreenShell';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { goBackOr } from '@/lib/navigation';
import type { InterestType, LenderType, LoanFrequency } from '@/types/schema';
import { fonts, radius, spacing, typography } from '@/constants/theme';
import { todayISO } from '@/utils/bn-numerals';

const LENDER_TYPES: { key: LenderType; label: string }[] = [
  { key: 'bank', label: 'ব্যাংক' },
  { key: 'mfi', label: 'এনজিও/এমএফআই' },
  { key: 'personal', label: 'ব্যক্তিগত' },
];

const INTEREST_TYPES: { key: InterestType; label: string }[] = [
  { key: 'flat', label: 'ফ্ল্যাট রেট' },
  { key: 'reducing', label: 'হ্রাসমান ব্যালেন্স' },
  { key: 'none', label: 'সুদ নেই' },
];

const FREQUENCIES: { key: LoanFrequency; label: string }[] = [
  { key: 'monthly', label: 'মাসিক' },
  { key: 'weekly', label: 'সাপ্তাহিক' },
];

export default function NewLoanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { business } = useAuth();
  const { repo } = useRepository();
  const { showSuccess, showError } = useToast();
  const { resolvedTheme: t } = useUiPreferences();
  const [lender, setLender] = useState('');
  const [lenderType, setLenderType] = useState<LenderType>('bank');
  const [loanType, setLoanType] = useState('ব্যবসায়িক');
  const [principal, setPrincipal] = useState('');
  const [installments, setInstallments] = useState('12');
  const [interestRate, setInterestRate] = useState('');
  const [interestType, setInterestType] = useState<InterestType>('flat');
  const [frequency, setFrequency] = useState<LoanFrequency>('monthly');
  const [disbursedOn, setDisbursedOn] = useState(todayISO());
  const [firstDueDate, setFirstDueDate] = useState(todayISO());
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!business || !lender.trim()) {
      showError('ঋণদাতার নাম দিন');
      return;
    }
    const amount = Number(principal);
    if (!amount || amount <= 0) {
      showError('সঠিক পরিমাণ দিন');
      return;
    }
    setLoading(true);
    try {
      await repo.createLoan(business.id, {
        lender_name: lender.trim(),
        loan_type: loanType,
        lender_type: lenderType,
        principal: amount,
        total_installments: Number(installments) || 12,
        interest_rate: Number(interestRate) || 0,
        interest_type: interestType,
        disbursed_on: disbursedOn,
        first_due_date: firstDueDate,
        frequency,
      });
      showSuccess('লোন যোগ হয়েছে');
      goBackOr('/loans');
    } catch {
      showError('সংরক্ষণ ব্যর্থ');
    }
    setLoading(false);
  };

  return (
    <AppScreenShell variant="modal">
      <ScreenHeader variant="modal" title="নতুন লোন" backFallback="/loans" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input label="ঋণদাতা" value={lender} onChangeText={setLender} placeholder="ব্যাংক / ব্যক্তি" />

        <Text style={[styles.label, { color: t.mutedDark }]}>ঋণদাতার ধরন</Text>
        <View style={styles.chips}>
          {LENDER_TYPES.map((o) => (
            <Pressable
              key={o.key}
              style={[
                styles.chip,
                { borderColor: t.border, backgroundColor: t.card },
                lenderType === o.key && { borderColor: t.brand, backgroundColor: `${t.brand}18` },
              ]}
              onPress={() => setLenderType(o.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: t.mutedDark },
                  lenderType === o.key && { color: t.brand, fontFamily: fonts.bengaliSemiBold },
                ]}
              >
                {o.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Input label="লোনের ধরন" value={loanType} onChangeText={setLoanType} />
        <Input label="মূল পরিমাণ (৳)" value={principal} onChangeText={setPrincipal} keyboardType="numeric" />
        <Input label="মোট কিস্তি" value={installments} onChangeText={setInstallments} keyboardType="numeric" />

        <Text style={[styles.label, { color: t.mutedDark }]}>কিস্তির ধরন</Text>
        <View style={styles.chips}>
          {FREQUENCIES.map((o) => (
            <Pressable
              key={o.key}
              style={[
                styles.chip,
                { borderColor: t.border, backgroundColor: t.card },
                frequency === o.key && { borderColor: t.brand, backgroundColor: `${t.brand}18` },
              ]}
              onPress={() => setFrequency(o.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: t.mutedDark },
                  frequency === o.key && { color: t.brand, fontFamily: fonts.bengaliSemiBold },
                ]}
              >
                {o.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Input label="সুদের হার (বার্ষিক %)" value={interestRate} onChangeText={setInterestRate} keyboardType="numeric" placeholder="0" />

        <Text style={[styles.label, { color: t.mutedDark }]}>সুদের ধরন</Text>
        <View style={styles.chips}>
          {INTEREST_TYPES.map((o) => (
            <Pressable
              key={o.key}
              style={[
                styles.chip,
                { borderColor: t.border, backgroundColor: t.card },
                interestType === o.key && { borderColor: t.brand, backgroundColor: `${t.brand}18` },
              ]}
              onPress={() => setInterestType(o.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: t.mutedDark },
                  interestType === o.key && { color: t.brand, fontFamily: fonts.bengaliSemiBold },
                ]}
              >
                {o.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Input label="বিতরণের তারিখ (YYYY-MM-DD)" value={disbursedOn} onChangeText={setDisbursedOn} />
        <Input label="প্রথম কিস্তির তারিখ (YYYY-MM-DD)" value={firstDueDate} onChangeText={setFirstDueDate} />

        <Button label="সংরক্ষণ করুন" onPress={submit} loading={loading} />
      </ScrollView>
    </AppScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xl },
  label: { ...typography.label },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { ...typography.bodySm },
});
