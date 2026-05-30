import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// Phase 0: the simplest possible screen, just to confirm the app runs on a
// real device and that editing this file updates the phone instantly (Fast Refresh).
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🐱</Text>
      <Text style={styles.title}>Cato</Text>
      <Text style={styles.subtitle}>your little reminder cat</Text>
      <Text style={styles.bilingual}>你好 · hello</Text>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF7F2',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 72,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#3A3A3A',
  },
  subtitle: {
    fontSize: 16,
    color: '#8A8A8A',
  },
  bilingual: {
    marginTop: 12,
    fontSize: 14,
    color: '#C08552',
  },
});
