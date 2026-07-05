import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AroponLogo } from '@/components/brand/AroponLogo';
import { useAuth } from '@/context/AuthContext';
import { useRepository } from '@/context/RepositoryContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { colors, radius, spacing } from '@/constants/theme';

export default function LanguageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, setLanguage, session } = useAuth();
  const { repo } = useRepository();
  const { resolvedTheme: t } = useUiPreferences();

  const onContinue = async () => {
    await repo.setLanguage?.(language);
    if (session?.user?.id) {
      await repo.upsertProfile({ user_id: session.user.id, language });
    }
    router.push('/(auth)/login');
  };

  return (
    <View style={[styles.root, { backgroundColor: t.surface }]}>
      <LinearGradient
        colors={[...t.heroGradient]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 32 }]}
      >
        {/* Decorative circles */}
        <View style={styles.deco1} />
        <View style={styles.deco2} />

        <AroponLogo size={100} />
        <Text style={styles.appName}>আরোপন</Text>
        <Text style={styles.tagline}>দোকানের হিসাব, সহজে হাতের মুঠোয়</Text>
      </LinearGradient>

      {/* ── Bottom sheet — white ── */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.handle} />

        <Text style={styles.sectionLabel}>ভাষা নির্বাচন করুন</Text>
        <Text style={styles.sectionSub}>Choose your preferred language</Text>

        <View style={styles.cards}>
          {/* Bangla */}
          <Pressable
            style={[styles.langCard, language === 'bn' && styles.langCardActive]}
            onPress={() => setLanguage('bn')}
          >
            <Text style={styles.langFlag}>🇧🇩</Text>
            <View style={styles.langTextCol}>
              <Text style={[styles.langTitle, language === 'bn' && styles.langTitleActive]}>
                বাংলা
              </Text>
              <Text style={styles.langSub}>Bangla</Text>
            </View>
            <View style={[styles.radioRing, language === 'bn' && styles.radioRingActive]}>
              {language === 'bn' && <View style={styles.radioDot} />}
            </View>
          </Pressable>

          {/* English */}
          <Pressable
            style={[styles.langCard, language === 'en' && styles.langCardActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={styles.langFlag}>🇬🇧</Text>
            <View style={styles.langTextCol}>
              <Text style={[styles.langTitle, language === 'en' && styles.langTitleActive]}>
                English
              </Text>
              <Text style={styles.langSub}>ইংরেজি</Text>
            </View>
            <View style={[styles.radioRing, language === 'en' && styles.radioRingActive]}>
              {language === 'en' && <View style={styles.radioDot} />}
            </View>
          </Pressable>
        </View>

        {/* CTA */}
        <Pressable style={styles.cta} onPress={onContinue}>
          <LinearGradient
            colors={[t.ctaGradient[0], t.ctaGradient[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>শুরু করুন</Text>
            <Text style={styles.ctaArrow}>→</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // ── Hero ──
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 32,
    gap: 14,
    overflow: 'hidden',
  },
  deco1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -60,
    right: -60,
  },
  deco2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(58,163,216,0.15)',
    bottom: 20,
    left: -30,
  },
  appName: {
    fontFamily: 'HindSiliguri_700Bold',
    fontSize: 36,
    color: colors.white,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  tagline: {
    fontFamily: 'HindSiliguri_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },

  // ── Bottom sheet ──
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xxl,
    paddingTop: 12,
    gap: 4,
    // Pull it up slightly over the hero
    marginTop: -24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: 'HindSiliguri_700Bold',
    fontSize: 20,
    color: '#1D2C23',
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: colors.muted,
    marginBottom: 8,
  },

  // ── Language cards ──
  cards: { gap: spacing.md, marginBottom: 8 },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  langCardActive: {
    borderColor: colors.brand,
    backgroundColor: `${colors.brand}08`,
  },
  langFlag: { fontSize: 32 },
  langTextCol: { flex: 1, gap: 2 },
  langTitle: {
    fontFamily: 'HindSiliguri_600SemiBold',
    fontSize: 18,
    color: '#22332A',
  },
  langTitleActive: { color: colors.brand },
  langSub: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: colors.muted,
  },
  radioRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioRingActive: { borderColor: colors.brand },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
  },

  // ── CTA button ──
  cta: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: 4,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  ctaText: {
    fontFamily: 'HindSiliguri_700Bold',
    fontSize: 18,
    color: colors.white,
  },
  ctaArrow: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 20,
    color: 'rgba(255,255,255,0.85)',
  },
});
