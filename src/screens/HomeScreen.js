// src/screens/HomeScreen.js
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';

export default function HomeScreen() {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn("Logout failed:", e);
    }
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido {user?.email ?? user?.displayName ?? "usuario"}</Text>

      <View style={{ height: 8 }} />
      <Button title="Ver eventos" onPress={() => router.push('/events')} />

      <View style={{ height: 12 }} />
      <Button title="Cerrar sesión" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, padding:20, alignItems:'center', justifyContent:'center'},
  title:{fontSize:18, marginBottom:12}
});
