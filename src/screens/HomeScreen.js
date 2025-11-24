// src/screens/HomeScreen.js
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../contexts/AuthContext';

export default function HomeScreen() {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn('Logout failed:', e);
    }
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        
        <Text style={styles.title}>Bienvenido {user?.email ?? user?.displayName ?? "usuario"}</Text>
        <View style={{ height: 12 }} />

        <View style={styles.btnBlock}>
          <Button title="Eventos" onPress={() => router.push('/events')} />
        </View>

        <View style={styles.btnBlock}>
          <Button title="Historial" onPress={() => router.push('/history')} />
        </View>

        <View style={styles.btnBlock}>
          <Button title="Estadísticas" onPress={() => router.push('/statistics')} />
        </View>

        <View style={{ height: 12 }} />
        <View style={styles.btnBlock}>
          <Button title="Cerrar sesión" color="#d9534f" onPress={handleLogout} />
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12, alignItems: 'stretch' },
  title: { fontSize: 18, marginBottom: 12, fontWeight: '700', textAlign: 'center'  },
  btnBlock: { marginVertical: 6 }
});
