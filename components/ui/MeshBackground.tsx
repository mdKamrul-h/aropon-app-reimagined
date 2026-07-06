import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useUiPreferences } from '@/context/UiPreferencesContext';

interface MeshBackgroundProps {
  children: ReactNode;
}

/** Clean warm background — subtle tint blobs only when playfulness is enabled */
export function MeshBackground({ children }: MeshBackgroundProps) {
  const { resolvedTheme: t, preferences } = useUiPreferences();
  const showBlobs = preferences.playfulness.blob;

  return (
    <View style={[styles.root, { backgroundColor: t.surface }]}>
      <View style={[styles.topWash, { backgroundColor: t.isDark ? 'transparent' : `${t.brand}06` }]} />
      {showBlobs ? (
        <>
          <View
            style={[
              styles.blob,
              styles.blob1,
              { backgroundColor: t.meshColors[0], opacity: t.meshOpacity * (t.isDark ? 1.1 : 1.6) },
            ]}
          />
          <View
            style={[
              styles.blob,
              styles.blob2,
              { backgroundColor: t.meshColors[1], opacity: t.meshOpacity * (t.isDark ? 0.8 : 1.2) },
            ]}
          />
        </>
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  topWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  content: { flex: 1 },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blob1: { width: 260, height: 260, top: 220, right: -60 },
  blob2: { width: 200, height: 200, top: 520, left: -80 },
});
