import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import useNotifications from '@/hooks/useNotifications';
import SocketProvider from './providers/socket-provider';

if (Platform.OS !== 'web') {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowList: true,
        }),
    });
}

export const unstable_settings = {
  anchor: '(tabs)',
};

function NotificationManager() {
    useNotifications();
    return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SocketProvider>
        <NotificationManager />
        <Stack screenOptions={{ headerShown: false }} />
      </SocketProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
