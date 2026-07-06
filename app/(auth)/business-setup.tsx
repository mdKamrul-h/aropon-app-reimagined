import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  OnboardingShell,
  ChoiceCard,
  YesNoToggle,
  ChoiceChipGrid,
} from '@/components/onboarding';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import {
  BUSINESS_TYPE_OPTIONS,
  DISTRICT_QUICK_PICKS,
  DISTRICT_SKIP,
  LENDER_CATEGORY_LABELS,
  LENDER_OPTIONS,
  LENDER_OTHER_ID,
  lenderLabelById,
} from '@/constants/onboarding';
import type { BusinessType } from '@/types/schema';
import { colors, spacing, typography } from '@/constants/theme';

const DEFAULT_SMS =
  'প্রিয় {{name}}, আপনার বাকি ৳{{amount}}। দয়া করে পরিশোধ করুন। — {{shop}}';

const TOTAL_STEPS = 2;

export default function BusinessSetupScreen() {
  const router = useRouter();
  const { session, setBusiness, setProfile, language, profile: authProfile } = useAuth();
  const { repo } = useRepository();

  const [step, setStep] = useState(1);
  const [bizType, setBizType] = useState<BusinessType>('grocery');
  const [hasLoan, setHasLoan] = useState(false);
  const [lenderId, setLenderId] = useState<string | null>(null);
  const [customLender, setCustomLender] = useState('');
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState(authProfile?.full_name ?? '');
  const [district, setDistrict] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ownerError, setOwnerError] = useState('');
  const [loanError, setLoanError] = useState('');

  const lenderGroups = useMemo(() => {
    const categories = ['bank', 'mfi', 'digital', 'personal', 'other'] as const;
    return categories.map((cat) => ({
      category: cat,
      label: LENDER_CATEGORY_LABELS[cat],
      options: LENDER_OPTIONS.filter((l) => l.category === cat).map((l) => ({
        id: l.id,
        label: l.label,
      })),
    }));
  }, []);

  const nextFromStep1 = () => {
    if (hasLoan) {
      const usingOther = lenderId === LENDER_OTHER_ID;
      if (!lenderId || (usingOther && !customLender.trim())) {
        setLoanError('ঋণদাতা বেছে নিন বা প্রতিষ্ঠানের নাম লিখুন');
        return;
      }
    }
    setLoanError('');
    setStep(2);
  };

  const submit = async () => {
    if (!session?.user || !shopName.trim()) {
      Alert.alert('দোকানের নাম দিন');
      return;
    }
    if (!ownerName.trim()) {
      setOwnerError('আপনার নাম দিন');
      return;
    }
    setOwnerError('');
    setLoading(true);

    try {
      await repo.upsertProfile({
        user_id: session.user.id,
        language,
        phone: session.user.phone,
        full_name: ownerName.trim(),
        username: authProfile?.username ?? null,
      });
      const profile = await repo.getProfile(session.user.id);
      if (profile) setProfile(profile);

      const biz = await repo.createBusiness(session.user.id, {
        name: shopName.trim(),
        owner_name: ownerName.trim(),
        business_type: bizType,
        district: district ?? DISTRICT_SKIP,
        logo_url: null,
        reminder_sms_template: DEFAULT_SMS,
      });

      if (hasLoan) {
        const lenderName =
          lenderId === LENDER_OTHER_ID
            ? customLender.trim()
            : lenderLabelById(lenderId!);
        await repo.createLoan(biz.id, {
          lender_name: lenderName,
          loan_type: 'সেটআপ বাকি',
          principal: 0,
          outstanding: 0,
          total_installments: 0,
          next_due_date: null,
        });
      }

      setBusiness(biz);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('সংরক্ষণ ব্যর্থ', 'আবার চেষ্টা করুন');
    } finally {
      setLoading(false);
    }
  };

  const footer =
    step < TOTAL_STEPS ? (
      <>
        <Button label="পরবর্তী →" onPress={nextFromStep1} />
        {step > 1 ? (
          <Button
            label="← পেছনে"
            variant="outline"
            onPress={() => setStep((s) => s - 1)}
            style={{ marginTop: spacing.sm }}
          />
        ) : null}
      </>
    ) : (
      <>
        <Button label="শুরু করুন →" onPress={submit} loading={loading} />
        <Button
          label="← পেছনে"
          variant="outline"
          onPress={() => setStep(1)}
          style={{ marginTop: spacing.sm }}
        />
      </>
    );

  if (step === 1) {
    return (
      <OnboardingShell
        step={1}
        totalSteps={TOTAL_STEPS}
        title="আপনার ব্যবসা কী ধরনের?"
        subtitle="একটি বেছে নিন — পরে পরিবর্তন করা যাবে"
        footer={footer}
      >
        <View style={styles.cardGrid}>
          {BUSINESS_TYPE_OPTIONS.map((b) => (
            <ChoiceCard
              key={b.key}
              label={b.label}
              icon={b.icon}
              selected={bizType === b.key}
              onPress={() => setBizType(b.key)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>লোন আছে?</Text>
          <YesNoToggle
            value={hasLoan}
            onChange={(v) => {
              setHasLoan(v);
              if (!v) {
                setLenderId(null);
                setCustomLender('');
                setLoanError('');
              }
            }}
          />
        </View>

        {hasLoan ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>কোথা থেকে?</Text>
            {lenderGroups.map((g) => (
              <ChoiceChipGrid
                key={g.category}
                groupLabel={g.label}
                options={g.options}
                selectedId={lenderId}
                onSelect={(id) => {
                  setLenderId(id);
                  setLoanError('');
                  if (id !== LENDER_OTHER_ID) setCustomLender('');
                }}
              />
            ))}
            {lenderId === LENDER_OTHER_ID ? (
              <Input
                label="প্রতিষ্ঠানের নাম লিখুন"
                value={customLender}
                onChangeText={setCustomLender}
                placeholder="যেমন: গ্রামীণ ব্যাংক"
                error={loanError}
              />
            ) : loanError ? (
              <Text style={styles.error}>{loanError}</Text>
            ) : null}
          </View>
        ) : null}
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      step={2}
      totalSteps={TOTAL_STEPS}
      title="দোকানের নাম দিন"
      subtitle="বাকি বিস্তারিত পরে যোগ করতে পারবেন"
      footer={footer}
    >
      <Input
        label="দোকানের নাম"
        value={shopName}
        onChangeText={setShopName}
        placeholder="আপনার দোকান"
      />
      <Input
        label="আপনার নাম"
        value={ownerName}
        onChangeText={setOwnerName}
        placeholder="মালিকের নাম"
        error={ownerError}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>জেলা (ঐচ্ছিক)</Text>
        <ChoiceChipGrid
          options={[
            ...DISTRICT_QUICK_PICKS.map((d) => ({ id: d, label: d })),
            { id: DISTRICT_SKIP, label: 'পরে যোগ করব' },
          ]}
          selectedId={district ?? DISTRICT_SKIP}
          onSelect={(id) => setDistrict(id === DISTRICT_SKIP ? null : id)}
        />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.mutedDark,
  },
  error: {
    ...typography.caption,
    color: colors.pay,
  },
});
