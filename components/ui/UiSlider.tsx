import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useUiPreferences } from '@/context/UiPreferencesContext';
import { typography } from '@/constants/theme';

interface UiSliderProps {
  label: string;
  value: number;
  options: number[];
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}

export function UiSlider({ label, value, options, onChange, formatValue }: UiSliderProps) {
  const { resolvedTheme: t } = useUiPreferences();
  const display = formatValue ? formatValue(value) : String(value);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: t.ink }]}>{label}</Text>
        <Text style={[styles.value, { color: t.brand }]}>{display}</Text>
      </View>
      <View style={styles.track}>
        {options.map((opt) => {
          const selected = opt === value;
          return (
            <AnimatedPressable
              key={opt}
              onPress={() => onChange(opt)}
              haptic="light"
              style={[
                styles.thumb,
                {
                  backgroundColor: selected ? t.brand : t.cardTint,
                  borderColor: selected ? t.brand : t.border,
                  borderRadius: t.radiusMd,
                },
              ]}
            >
              <Text style={[styles.thumbText, { color: selected ? '#fff' : t.muted }]}>
                {formatValue ? formatValue(opt) : String(opt)}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...typography.label },
  value: { ...typography.caption, fontFamily: typography.sectionTitle.fontFamily },
  track: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  thumb: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  thumbText: { ...typography.caption, fontFamily: typography.sectionTitle.fontFamily },
});
