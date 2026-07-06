import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useUiPreferences } from '@/context/UiPreferencesContext';

export default function IndexGate() {
  const { session, profile, business, loading } = useAuth();
  const { resolvedTheme: t } = useUiPreferences();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface }}>
        <ActivityIndicator color={t.brand} size="large" />
      </View>
    );
  }

  if (session && business) {
    return <Redirect href="/(tabs)" />;
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!profile?.username) return <Redirect href="/(auth)/set-credentials" />;
  return <Redirect href="/(auth)/business-setup" />;
}
