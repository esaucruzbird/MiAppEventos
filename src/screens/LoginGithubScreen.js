import { makeRedirectUri, startAsync } from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useContext, useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  signOut as firebaseSignOut,
  GithubAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../api/firebase";
import { AuthContext } from "../contexts/AuthContext";
import { exchangeCodeForToken } from "../utils/exchangeToken"; // revisa ruta/nombre

WebBrowser.maybeCompleteAuthSession();

export default function LoginGithubScreen() {
  const router = useRouter();
  const { setUser } = useContext(AuthContext || {});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Credenciales de GitHub
  const GITHUB_CLIENT_ID = "Ov23liIWeF4VD6Q4ZD6S";
  const GITHUB_CLIENT_SECRET = "c4d3ba0295646ffc98a3b338f29c5cfac1c9fe53"; // solo en DEV
  const EXPO_PROXY_URL = "https://auth.expo.io/@esaucruz/MiApp";

  const handleEmailLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (setUser) setUser(userCredential.user);
      router.replace("/home");
    } catch (err) {
      Alert.alert("Error login", err.message || String(err));
    }
  };

  const handleGithubLogin = async () => {
    try {
      // cerrar sesión local en Firebase antes del flujo
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        console.warn("firebaseSignOut:", e?.message || e);
      }

      // generar redirectUri al hacer clic (evita logs al inicio)
      let redirectUri = makeRedirectUri({ useProxy: true });
      if (typeof redirectUri === "string" && redirectUri.startsWith("exp://")) {
        redirectUri = EXPO_PROXY_URL;
      }

      const authUrl = `https://github.com/login/oauth/authorize` +
        `?client_id=${GITHUB_CLIENT_ID}` +
        `&scope=read:user%20user:email` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}`;

      console.log("CLICK DEBUG: redirectUri (effective):", redirectUri);
      console.log("CLICK DEBUG: authUrl:", authUrl);

      // abrir la ventana / prompt
      let result;
      if (typeof startAsync === "function") {
        result = await startAsync({ authUrl });
      } else {
        const wb = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
        console.log("CLICK DEBUG: wb (openAuthSessionAsync) result:", wb);
        if (wb.type !== "success") {
          console.log("OAuth canceled/failed (wb.type !== success)");
          return;
        }
        // extraer code del wb.url
        const returnedUrl = wb.url || "";
        let code = null;
        try {
          const u = new URL(returnedUrl);
          code = u.searchParams.get("code");
        } catch (e) {
          const m = returnedUrl.match(/[?&]code=([^&]+)/);
          if (m) code = decodeURIComponent(m[1]);
        }
        if (!code) throw new Error("No se obtuvo code desde wb.url");
        result = { type: "success", params: { code } };
      }

      console.log("CLICK DEBUG: result from auth window:", result);

      if (result.type !== "success") {
        console.log("Auth result not success:", result);
        return;
      }

      const code = result.params?.code;
      if (!code) throw new Error("No se obtuvo código de GitHub");

      // Exchange: code -> access_token (DEV: uses client_secret here)
      const tokenResp = await exchangeCodeForToken({
        code,
        clientId: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        redirectUri,
      });

      console.log("CLICK DEBUG: tokenResp:", tokenResp);

      if (!tokenResp || tokenResp.error || !tokenResp.access_token) {
        // muestra la respuesta completa para diagnóstico
        throw new Error("Intercambio de token falló: " + JSON.stringify(tokenResp));
      }

      const accessToken = tokenResp.access_token;

      // Sign in with Firebase using the GitHub credential
      let userCredential;
      try {
        const credential = GithubAuthProvider.credential(accessToken);
        userCredential = await signInWithCredential(auth, credential);
      } catch (fbErr) {
        console.error("FIREBASE_SIGNIN_ERROR:", fbErr);
        throw fbErr;
      }

      console.log("CLICK DEBUG: userCredential:", userCredential?.user?.uid);

      // crear perfil si no existe
      const uid = userCredential.user.uid;
      const userDocRef = doc(db, "users", uid);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        await setDoc(userDocRef, {
          email: userCredential.user.email || null,
          displayName: userCredential.user.displayName || null,
          provider: "github",
          createdAt: new Date().toISOString(),
        });
      }

      if (setUser) setUser(userCredential.user);
      router.replace("/home");
    } catch (err) {
      console.error("GitHub flow fatal error:", err);
      Alert.alert("GitHub login error", (err && err.message) ? err.message : JSON.stringify(err));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top','left','right']}>
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>

      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      <Button title="Iniciar con Email" onPress={handleEmailLogin} />

      <View style={{ height: 18 }} />

      <Button title="Iniciar con GitHub" onPress={handleGithubLogin} />

      <View style={{ height: 18 }} />
      <Button title="Registrarse" onPress={() => router.push("/register" )} />
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12, justifyContent: 'center' },
  title: { fontSize: 22, marginBottom: 20, fontWeight: '700' },
  input: { borderWidth: 1, padding: 10, marginBottom: 12, borderRadius: 8, borderColor: '#eee' },
});
