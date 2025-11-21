// src/screens/RegisterScreen.js
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useContext, useState } from "react";
import { ActivityIndicator, Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { auth, db } from "../api/firebase";
import { AuthContext } from "../contexts/AuthContext";

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser } = useContext(AuthContext || {});
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // validaciones mínimas
    if (!email.trim() || !password) {
      Alert.alert("Error", "Introduce email y contraseña.");
      return;
    }

    setLoading(true);
    console.log("REG: start register", { email: email.trim(), displayName });

    try {
      // 1) Crear en Firebase Auth (createUserWithEmailAndPassword hace sign-in automáticamente)
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      console.log("REG: created user in Auth uid=", user.uid);

      // 2) Crear perfil en Firestore (users/{uid})
      await setDoc(doc(db, "users", user.uid), {
        displayName: displayName || null,
        email: user.email,
        role: "user",
        createdAt: new Date().toISOString()
      });
      console.log("REG: created user document in Firestore uid=", user.uid);

      // 3) Actualizar context para reflejar el usuario inmediatamente (opcional)
      if (typeof setUser === "function") {
        setUser(user);
      }

      // 4) Navegar al home (o login). Usamos replace para que no se pueda volver atrás.
      // Hacemos un pequeño timeout 150ms para dar tiempo a que el listener onAuthStateChanged
      // (si existe) sincronice; no es obligatorio, pero evita carreras raras.
      setTimeout(() => {
        try {
          router.replace("/home");
          console.log("REG: router.replace('/home') called");
        } catch (navErr) {
          console.warn("REG: navigation error", navErr);
        }
      }, 150);

      // IMPORTANTE: devolvemos aquí (opcional). El setLoading(false) queda en finally.
      return;
    } catch (err) {
      console.error("Register error:", err);
      Alert.alert("Error al crear cuenta", err.message || String(err));
    } finally {
      setLoading(false);
      console.log("REG: finished (loading=false)");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>

      <TextInput
        placeholder="Nombre"
        value={displayName}
        onChangeText={setDisplayName}
        style={styles.input}
        returnKeyType="next"
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
      />

      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        returnKeyType="done"
      />

      <View style={{ height: 12 }} />

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Crear cuenta" onPress={handleRegister} />
      )}

      <View style={{ height: 12 }} />
      <Button title="Ir a Login" onPress={() => router.replace("/login")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 22, marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 6 }
});
