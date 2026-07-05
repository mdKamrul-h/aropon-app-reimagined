import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="language" />
      <Stack.Screen name="login" />
      <Stack.Screen name="phone" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="set-credentials" />
      <Stack.Screen name="business-setup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
