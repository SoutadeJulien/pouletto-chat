import { ThemedText } from '@/components/themed-text';
import { colors, styles } from '@/constants/style';
import { getServerUrl, setServerUrl } from '@/app/core/serverUrl';
import { socketReconnectContext } from '@/app/providers/socket-provider';
import { router } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, TextInput, View } from 'react-native';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function SetupScreen() {
  const [url, setUrl] = useState('http://');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const reconnect = useContext(socketReconnectContext);

  useEffect(() => {
    (async () => {
      const existing = await getServerUrl();
      if (existing) setUrl(existing);
    })();
  }, []);

  const handleContinue = async () => {
    const trimmed = url.trim();
    if (!trimmed || trimmed === 'http://') return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${trimmed}/api/health`, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      setStatus('success');
      await setServerUrl(trimmed);
      reconnect();
      setTimeout(() => router.replace('/'), 800);
    } catch (e: unknown) {
      const msg = e instanceof Error && e.name === 'AbortError'
        ? 'Délai dépassé — serveur inaccessible'
        : 'Impossible de joindre le serveur';
      setStatus('error');
      setErrorMsg(msg);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
      <ThemedText type="title" style={{ color: colors.white }}>Pouletto Chat</ThemedText>
      <ThemedText type="subtitle" style={[styles.subtitle, { color: colors.white }]}>
        Entrez l'adresse du serveur pour continuer.
      </ThemedText>
      <View style={styles.formContainer}>
        <ThemedText type="subtitle" style={[styles.subtitle, { color: colors.white }]}>Configuration</ThemedText>
        <TextInput
          placeholder="http://10.0.2.2:3737 (émulateur) ou http://192.168.1.X:3737"
          placeholderTextColor="rgba(196, 32, 146, 0.5)"
          onChangeText={(t) => { setUrl(t); setStatus('idle'); }}
          value={url}
          style={[
            styles.input,
            status === 'error' && { borderColor: '#FF4444', borderWidth: 2 },
            status === 'success' && { borderColor: '#44CC44', borderWidth: 2 },
          ]}
          autoCapitalize="none"
          keyboardType="url"
          editable={status !== 'loading'}
        />
        {status === 'error' && (
          <ThemedText type="default" style={{ color: '#FF4444', textAlign: 'center', fontSize: 14 }}>
            {errorMsg}
          </ThemedText>
        )}
        {status === 'success' && (
          <ThemedText type="default" style={{ color: '#44CC44', textAlign: 'center', fontSize: 14 }}>
            Serveur connecté !
          </ThemedText>
        )}
        <Pressable
          style={[styles.button, status === 'loading' && { opacity: 0.7 }]}
          onPress={handleContinue}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <ActivityIndicator color="rgb(196, 32, 146)" />
          ) : (
            <ThemedText type="default" style={styles.buttonText}>
              Continuer
            </ThemedText>
          )}
        </Pressable>
      </View>
    </View>
  );
}
