import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { TabShell } from '@/components/nav/TabShell';
import { MeshBackground } from '@/components/ui/MeshBackground';
import type { TabShellActive } from '@/constants/navigation';
import { useUiPreferences } from '@/context/UiPreferencesContext';

export type AppScreenVariant = 'tabRoot' | 'stack' | 'ledger' | 'modal' | 'auth';

interface AppScreenShellProps {
  children: ReactNode;
  variant?: AppScreenVariant;
  /** Show bottom nav on stack/ledger screens */
  tabActive?: TabShellActive;
  withNav?: boolean;
  style?: StyleProp<ViewStyle>;
  footer?: ReactNode;
}

export function AppScreenShell({
  children,
  variant = 'stack',
  tabActive,
  withNav = false,
  style,
  footer,
}: AppScreenShellProps) {
  const { resolvedTheme: t } = useUiPreferences();
  const showNav = withNav && tabActive && variant !== 'modal' && variant !== 'auth';
  // Every path below except modal/auth wraps body in MeshBackground, which
  // already paints t.surface + blobs on its own root — an opaque body
  // background here would sit on top and hide them completely.
  const wrapsWithMesh = variant !== 'modal' && variant !== 'auth' && !(showNav && variant === 'tabRoot');

  const body = (
    <View
      style={[
        styles.root,
        { backgroundColor: variant === 'modal' ? t.card : wrapsWithMesh ? 'transparent' : t.surface },
        style,
      ]}
    >
      <View style={styles.flex}>{children}</View>
      {footer}
    </View>
  );

  if (variant === 'modal' || variant === 'auth') {
    return body;
  }

  if (showNav && tabActive) {
    return <TabShell active={tabActive}>{variant === 'tabRoot' ? body : <MeshBackground>{body}</MeshBackground>}</TabShell>;
  }

  return <MeshBackground>{body}</MeshBackground>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
});
