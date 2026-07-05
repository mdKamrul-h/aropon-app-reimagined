import { useState } from 'react';

import { ScrollView, StyleSheet, View, Text, Pressable } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';

import { Input } from '@/components/ui/Input';

import { ScreenHeader } from '@/components/ui/ScreenHeader';

import { TabScreenShell } from '@/components/ui/TabScreenShell';

import { useToast } from '@/context/ToastContext';

import { useAuth } from '@/context/AuthContext';

import { useRepository } from '@/context/RepositoryContext';

import { useUiPreferences } from '@/context/UiPreferencesContext';

import { goBackOr } from '@/lib/navigation';

import type { PartyType } from '@/types/schema';

import { partyTypeNewTitle } from '@/constants/partyLabels';

import { radius, spacing, typography } from '@/constants/theme';



export default function NewPartyScreen() {

  const params = useLocalSearchParams<{ type?: string }>();

  const type = (params.type === 'dealer' ? 'dealer' : 'customer') as PartyType;

  const insets = useSafeAreaInsets();

  const { business } = useAuth();

  const { repo } = useRepository();

  const { showSuccess, showError } = useToast();

  const { resolvedTheme: t } = useUiPreferences();

  const [name, setName] = useState('');

  const [phone, setPhone] = useState('01');

  const [openingAmount, setOpeningAmount] = useState('');

  const [openingDirection, setOpeningDirection] = useState<'receivable' | 'payable'>('receivable');

  const [loading, setLoading] = useState(false);



  const submit = async () => {

    if (!business || !name.trim()) {

      showError('নাম দিন');

      return;

    }

    setLoading(true);

    try {

      const party = await repo.createParty({

        business_id: business.id,

        name: name.trim(),

        phone: phone.trim() || null,

        type,

      });



      const amount = Number(openingAmount.replace(/[^\d.]/g, ''));

      if (amount > 0) {

        const isReceivable = openingDirection === 'receivable';

        await repo.createTransaction({

          business_id: business.id,

          party_id: party.id,

          type: isReceivable ? 'sale' : 'purchase',

          amount,

          is_credit: true,

          note: 'শুরুর বাকি',

        });

      }



      showSuccess('যোগ হয়েছে');

      goBackOr('/khata');

    } catch {

      showError('সংরক্ষণ ব্যর্থ');

    }

    setLoading(false);

  };



  return (

    <TabScreenShell variant="modal">

    <View style={{ flex: 1, paddingBottom: insets.bottom }}>

      <ScreenHeader variant="modal" title={partyTypeNewTitle(type)} backFallback="/khata" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Input label="নাম" value={name} onChangeText={setName} />

        <Input label="মোবাইল" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />



        <Text style={[styles.sectionLabel, { color: t.mutedDark }]}>শুরুর বাকি (ঐচ্ছিক)</Text>

        <Input

          label="পরিমাণ (৳)"

          value={openingAmount}

          onChangeText={setOpeningAmount}

          keyboardType="numeric"

          placeholder="০"

        />

        <View style={styles.toggleRow}>

          <Pressable

            style={[

              styles.toggleBtn,

              {

                borderColor: openingDirection === 'receivable' ? t.brand : t.border,

                backgroundColor: openingDirection === 'receivable' ? t.cardTint : t.card,

              },

            ]}

            onPress={() => setOpeningDirection('receivable')}

          >

            <Text

              style={[

                styles.toggleText,

                { color: openingDirection === 'receivable' ? t.brand : t.mutedDark },

              ]}

            >

              আমি পাবো

            </Text>

          </Pressable>

          <Pressable

            style={[

              styles.toggleBtn,

              {

                borderColor: openingDirection === 'payable' ? t.brand : t.border,

                backgroundColor: openingDirection === 'payable' ? t.cardTint : t.card,

              },

            ]}

            onPress={() => setOpeningDirection('payable')}

          >

            <Text

              style={[

                styles.toggleText,

                { color: openingDirection === 'payable' ? t.brand : t.mutedDark },

              ]}

            >

              আমি দিবো

            </Text>

          </Pressable>

        </View>



        <Button label="সংরক্ষণ করুন" onPress={submit} loading={loading} />

      </ScrollView>

    </View>

    </TabScreenShell>

  );

}



const styles = StyleSheet.create({

  content: { padding: spacing.xl, gap: spacing.md },

  sectionLabel: { ...typography.label, marginTop: spacing.sm },

  toggleRow: { flexDirection: 'row', gap: spacing.sm },

  toggleBtn: {

    flex: 1,

    paddingVertical: spacing.md,

    borderRadius: radius.lg,

    borderWidth: 1.5,

    alignItems: 'center',

  },

  toggleText: { ...typography.bodySm },

});

