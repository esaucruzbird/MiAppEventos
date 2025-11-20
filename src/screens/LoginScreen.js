// src/screens/LoginScreen.js
import { makeRedirectUri } from 'expo-auth-session';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as WebBrowser from 'expo-web-browser';
import { FacebookAuthProvider, signInWithCredential, signInWithEmailAndPassword } from "firebase/auth";
import { useContext, useEffect, useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { auth } from "../api/firebase";
import { AuthContext } from "../contexts/AuthContext";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const { setUser } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Configurar Facebook useAuthRequest
  const [request, response, promptAsync] = Facebook.useAuthRequest({
    // clientId = FACEBOOK_APP_ID (de Facebook Developer)
    clientId: "TU_FACEBOOK_APP_ID",
    // useProxy: true hace que expo use https://auth.expo.io/@username/slug como redirect
    redirectUri: makeRedirectUri({ useProxy: true })
  });

  // Manejo de respuesta de Facebook
  useEffect(() => {
    if (response?.type === 'success') {
      const { access_token } = response.params || response.authentication || {};
      if (access_token) {
        // Intercambiar token FB por credenciales Firebase
        const credential = FacebookAuthProvider.credential(access_token);
        signInWithCredential(auth, credential)
          .then((userCredential) => {
            // userCredential.user es el usuario logueado
            setUser(userCredential.user);
          })
          .catch((err) => {
            Alert.alert("Error Firebase FB", err.message);
          });
      }
    }
  }, [response]);

  const handleEmailLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
    } catch (err) {
      Alert.alert("Error login", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>

      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input}/>
      <TextInput placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry style={styles.input}/>
      <Button title="Iniciar con Email" onPress={handleEmailLogin}/>

      <View style={{height:20}} />

      <Button
        title="Continuar con Facebook"
        disabled={!request}
        onPress={() => {
          promptAsync({ useProxy: true });
        }}
      />

      <View style={{height:20}} />
      <Button title="Registrarse" onPress={() => navigation.navigate("Register")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, padding:20, justifyContent:'center'},
  title:{fontSize:22, marginBottom:20},
  input:{borderWidth:1, padding:10, marginBottom:10, borderRadius:6}
});
