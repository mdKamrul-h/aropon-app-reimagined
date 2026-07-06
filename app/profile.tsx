import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { TabScreenShell } from '@/components/ui/TabScreenShell';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { cardSurfaceStyle } from '@/lib/ui/cardSurfaceStyle';
import { goBackOr } from '@/lib/navigation';
import { uploadBusinessLogo } from '@/lib/storage/businessLogo';
import { BUSINESS_TYPE_OPTIONS } from '@/constants/onboarding';
import type { BusinessType } from '@/types/schema';
import { fonts, radius, spacing, typography } from '@/constants/theme';

const BIZ_TYPES = BUSINESS_TYPE_OPTIONS.map((b) => ({ key: b.key, label: b.label.split(' / ')[0]! }));

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { resolvedTheme: t } = useUiPreferences();
  const { business, profile, session, setBusiness, setProfile } = useAuth();
  const { repo } = useRepository();
  const { showSuccess, showError } = useToast();
  const [shopName, setShopName] = useState(business?.name ?? '');
  const [ownerName, setOwnerName] = useState(business?.owner_name ?? '');
  const [district, setDistrict] = useState(business?.district ?? '');
  const [address, setAddress] = useState(business?.address ?? '');
  const [establishedOn, setEstablishedOn] = useState(business?.established_on ?? '');
  const [tradeLicenseNo, setTradeLicenseNo] = useState(business?.trade_license_no ?? '');
  const [nidNo, setNidNo] = useState(business?.nid_no ?? '');
  const [bizType, setBizType] = useState<BusinessType>(business?.business_type ?? 'grocery');
  const [logoUri, setLogoUri] = useState<string | null>(business?.logo_url ?? null);
  const [loading, setLoading] = useState(false);

  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('অনুমতি প্রয়োজন', 'লোগো আপলোড করতে গ্যালারি অনুমতি দিন।');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const submit = async () => {
    if (!business || !profile) return;
    setLoading(true);
    try {
      let logoUrl = business.logo_url;
      if (logoUri && logoUri !== business.logo_url && session?.user) {
        logoUrl = await uploadBusinessLogo(session.user.id, logoUri);
      }
      const updated = await repo.updateBusiness(business.id, {
        name: shopName,
        owner_name: ownerName,
        district,
        address: address || null,
        established_on: establishedOn || null,
        trade_license_no: tradeLicenseNo || null,
        nid_no: nidNo || null,
        business_type: bizType,
        logo_url: logoUrl,
      });
      const prof = await repo.upsertProfile({
        user_id: profile.user_id,
        full_name: ownerName,
        username: profile.username,
        language: profile.language,
        phone: profile.phone,
      });
      setBusiness(updated);
      setProfile(prof);
      showSuccess('প্রোফাইল আপডেট হয়েছে');
      goBackOr('/settings' as never);
    } catch {
      showError('সংরক্ষণ ব্যর্থ');
    }
    setLoading(false);
  };

  return (
    <TabScreenShell withNav tabActive="more">
      <ScreenHeader title="প্রোফাইল" backFallback={'/settings' as never} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          style={[styles.logoUpload, { borderColor: t.brand }]}
          onPress={pickLogo}
        >
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logoImage} contentFit="cover" />
          ) : (
            <Text style={[styles.logoPlaceholder, { color: t.brand }]}>{shopName.charAt(0) || '?'}</Text>
          )}
        </Pressable>

        <SurfaceCard style={styles.section}>
          <SectionHeader icon="profile" title="দোকানের পরিচয়" />
          <Input label="ইউজারনেম" value={profile?.username ?? ''} editable={false} />
          <Input label="মোবাইল" value={profile?.phone ?? ''} editable={false} />
          <Input label="দোকানের নাম" value={shopName} onChangeText={setShopName} />
          <Input label="মালিকের নাম" value={ownerName} onChangeText={setOwnerName} />
          <Input label="জেলা" value={district} onChangeText={setDistrict} />
          <Text style={[styles.chipLabel, { color: t.mutedDark }]}>ব্যবসার ধরন</Text>
          <View style={styles.chips}>
            {BIZ_TYPES.map((b) => (
              <Pressable
                key={b.key}
                style={[
                  styles.chip,
                  cardSurfaceStyle(t),
                  { backgroundColor: t.card },
                  bizType === b.key && { backgroundColor: `${t.brand}18` },
                ]}
                onPress={() => setBizType(b.key)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: t.mutedDark },
                    bizType === b.key && { color: t.brand, fontFamily: fonts.bengaliSemiBold },
                  ]}
                >
                  {b.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </SurfaceCard>

        <SurfaceCard style={styles.section}>
          <SectionHeader icon="ledger" title="ঋণ প্রতিবেদনের জন্য তথ্য (ঐচ্ছিক)" />
          <Input label="ঠিকানা" value={address} onChangeText={setAddress} multiline />
          <Input
            label="প্রতিষ্ঠার তারিখ (YYYY-MM-DD)"
            value={establishedOn}
            onChangeText={setEstablishedOn}
            placeholder="২০১৮-০৫-০১"
          />
          <Input label="ট্রেড লাইসেন্স নম্বর" value={tradeLicenseNo} onChangeText={setTradeLicenseNo} />
          <Input label="মালিকের এনআইডি নম্বর" value={nidNo} onChangeText={setNidNo} />
        </SurfaceCard>

        <Button label="সংরক্ষণ করুন" onPress={submit} loading={loading} />
      </ScrollView>
    </TabScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md },
  logoUpload: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  logoImage: { width: 80, height: 80 },
  logoPlaceholder: { fontFamily: fonts.bengaliBold, fontSize: 28 },
  section: { gap: spacing.md },
  chipLabel: { ...typography.label },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  chipText: { ...typography.bodySm },
});
