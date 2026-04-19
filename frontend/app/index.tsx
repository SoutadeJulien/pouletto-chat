
import { ThemedText } from '@/components/themed-text';
import { colors, styles } from '@/constants/style';
import { useLogin } from '@/hooks/useLogin';
import useSendSocket from '@/hooks/useSendSocket';
import { User } from '@/types/users';
import { useEffect } from 'react';
import { Image, Pressable, TextInput, View } from 'react-native';
import storage from './core/technical';
import { getServerUrl } from './core/serverUrl';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { username, setUsername, login, ErrorModalComponent } = useLogin();
  const { send, isConnected } = useSendSocket();

  useEffect(() => {
    (async () => {
      const url = await getServerUrl();
      if (!url) router.replace('/setup');
    })();
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    (async () => {
      try {
        const userStr = await storage.getItem('user');
        if (!userStr) return;

        const currentUser: User = JSON.parse(userStr);
        if (!currentUser.id) return;

        send('handleLogin', {
          currentUserId: currentUser.id,
          isConnected: true,
        });
        router.replace('/friend-list');
      } catch (error) {
        console.error('Error during logout:', error);
      }
    })();
  }, [isConnected, send]);

  return (
    <View style={styles.mainContainer}>
      <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
      <ThemedText type="title" style={{ color: colors.white }}>Pouletto Chat</ThemedText>
      <ThemedText type="subtitle" style={[styles.subtitle, { color: colors.white }]}>La meilleure façon de communiquer avec Pouletto !</ThemedText>
      <View style={styles.formContainer}>
        <ThemedText type="subtitle" style={[styles.subtitle, { color: colors.white }]}>Connexion</ThemedText>
        <TextInput
          placeholder="nom d'utilisateur"
          placeholderTextColor="rgba(196, 32, 146, 0.5)"
          onChangeText={(text) => setUsername(text)}
          value={username}
          style={styles.input}
        />

        <Pressable style={styles.button} onPress={login}>
          <ThemedText
            type="default"
            style={styles.buttonText}
          >
            Connexion
          </ThemedText>
        </Pressable>

        <Pressable style={[styles.button, { marginTop: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.white }]} onPress={() => router.replace('/setup')}>
          <ThemedText type="default" style={[styles.buttonText, { color: colors.white }]}>
            Changer l'URL du serveur
          </ThemedText>
        </Pressable>
      </View>
      <ErrorModalComponent />
    </View>
  );
}

