// src/screens/HomeScreen.js
import { useRouter } from "expo-router";
import { useContext } from "react";
import { Button, Text, View } from "react-native";
import { AuthContext } from "../contexts/AuthContext";

export default function HomeScreen(){
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();               // signOut de Firebase
    router.replace("/login"); // navegar al login
  };

  return (
    <View>
      <Text>Bienvenido {user?.email ?? user?.displayName ?? "usuario"}</Text>
      <Button title="Cerrar sesión" onPress={handleLogout} />
    </View>
  );
}
