// app/index.tsx
import { useRouter } from "expo-router";
import React, { useContext, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthContext } from "../src/contexts/AuthContext";

export default function Index() {
  const router = useRouter();
  const { user, initializing } = useContext(AuthContext);

  useEffect(() => {
    if (initializing) return;
    if (user) {
      // casteamos a any para evitar el chequeo estricto de rutas de TS en desarrollo
      router.replace("/home" as any);
    } else {
      router.replace("/login" as any);
    }
    // incluir router en deps para silenciar el lint rule
  }, [user, initializing, router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
