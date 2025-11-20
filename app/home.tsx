// app/home.tsx
import { useRouter } from "expo-router";
import React, { useContext } from "react";
import { Button, Text, View } from "react-native";
import { AuthContext } from "../src/contexts/AuthContext";

export default function Home() {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();               // signOut de Firebase
    router.replace("/login" as any); // navegar al login
  };

  return (
    <View>
      <Text>Bienvenido {user?.email ?? user?.displayName ?? "usuario"}</Text>
      <Button title="Cerrar sesión" onPress={handleLogout} />
    </View>
  );
}
