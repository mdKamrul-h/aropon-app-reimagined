import { useEffect, useState } from 'react';
import { AppStack } from '@/components/nav/AppStack';
import { AppStatusBar } from '@/components/ui/AppStatusBar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Platform, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  HindSiliguri_400Regular,
  HindSiliguri_500Medium,
  HindSiliguri_600SemiBold,
  HindSiliguri_700Bold,
} from '@expo-google-fonts/hind-siliguri';
import {
  Outfit_400Regular,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';
import { AuthProvider } from '@/context/AuthContext';
import { RepositoryProvider } from '@/context/RepositoryContext';
import { UiPreferencesProvider } from '@/context/UiPreferencesContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { AppSplash } from '@/components/splash/AppSplash';
import { registerForPushNotifications } from '@/lib/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    HindSiliguri_400Regular,
    HindSiliguri_500Medium,
    HindSiliguri_600SemiBold,
    HindSiliguri_700Bold,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
  });
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      registerForPushNotifications().catch(() => {});
    }
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <BottomSheetModalProvider>
      <AuthProvider>
        <RepositoryProvider>
          <UiPreferencesProvider>
          <ThemeProvider>
          <ToastProvider>
          <AppStatusBar />
          <AppStack />
          {showSplash ? <AppSplash onFinish={() => setShowSplash(false)} /> : null}
          </ToastProvider>
          </ThemeProvider>
          </UiPreferencesProvider>
        </RepositoryProvider>
      </AuthProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
