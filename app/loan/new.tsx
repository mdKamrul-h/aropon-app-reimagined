import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AppScreenShell } from '@/components/layout/AppScreenShell';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { goBackOr } from '@/lib/navigation';
import { colors, spacing } from '@/constants/theme';

export default function NewLoanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { business } = useAuth();
  const { repo } = useRepository();
  const { showSuccess, showError } = useToast();
  const [lender, setLender] = useState('');
  const [loanType, setLoanType] = useState('ব্যক্তিগত');
  const [principal, setPrincipal] = useState('');
  const [installments, setInstallments] = useState('12');
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
        principal: amount,
        total_installments: Number(installments) || 12,
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
        <Input label="লোনের ধরন" value={loanType} onChangeText={setLoanType} />
        <Input label="মূল পরিমাণ (৳)" value={principal} onChangeText={setPrincipal} keyboardType="numeric" />
        <Input label="মোট কিস্তি" value={installments} onChangeText={setInstallments} keyboardType="numeric" />
        <Button label="সংরক্ষণ করুন" onPress={submit} loading={loading} />
      </ScrollView>
    </AppScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xl },
});
