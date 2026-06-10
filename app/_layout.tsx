import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useFonts, Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { colors } from '../src/theme';
import { useStore } from '../src/store';
import { useSettings } from '../src/settings';
import { requestPermissions } from '../src/notifications';

export default function RootLayout() {
  const loadAll = useStore((s) => s.loadAll);
  const loadSettings = useSettings((s) => s.load);

  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    loadAll();
    loadSettings();
    requestPermissions().then((granted) => {
      console.log('[notif] Permission:', granted ? 'granted' : 'denied');
    });
  }, [loadAll, loadSettings]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}
