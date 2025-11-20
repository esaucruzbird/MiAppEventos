// src/screens/RegisterScreen.js
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { auth, db } from "../api/firebase";

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      // Crear documento de usuario en Firestore
      await setDoc(doc(db, "users", uid), {
        displayName,
        email,
        createdAt: new Date().toISOString(),
        role: "user"
      });
      Alert.alert("Registrado", "Usuario creado correctamente");
      // Navegar al login o home
      router.replace("/login");
    } catch (err) {
      Alert.alert("Error registro", err.message || String(err));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>
      <TextInput placeholder="Nombre" value={displayName} onChangeText={setDisplayName} style={styles.input}/>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input}/>
      <TextInput placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry style={styles.input}/>
      <Button title="Crear cuenta" onPress={handleRegister}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, padding:20, justifyContent:'center'},
  title:{fontSize:22, marginBottom:20},
  input:{borderWidth:1, padding:10, marginBottom:10, borderRadius:6}
});
