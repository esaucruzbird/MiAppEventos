<<<<<<<
# MiAppEventos
>>>>>>>
# Bienvenido a mi aplicación para la gestión de eventos

Esta aplicación fue desarrollada con Expo, con el comando: [`npx create-expo-app`](https://www.npmjs.com/package/create-expo-app).
Además, implementa la herramienta de FireBase y FireStore, por lo que necesitará una cuenta activa en [`FireBase`](https://console.firebase.google.com/).

## Para iniciar

1. Instalar las dependencias básicas, en el PDF se detallan algunas más

   ```bash
   npm install
   npm install firebase @react-navigation/native @react-navigation/native-stack react-native-gesture-handler react-native-screens
   npm install expo-auth-session expo-notifications expo-constants expo-secure-store
   npm install firebase @react-navigation/native @react-navigation/native-stack
   npx expo@latest install react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated
   npx expo install expo-auth-session expo-crypto expo-web-browser
   npx expo install @react-native-async-storage/async-storage
   npm install @react-navigation/native @react-navigation/native-stack
   npx expo install react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated
   npm install formik yup
   npx expo register
   npx expo login
   npx expo install @react-native-community/datetimepicker
   npx expo install expo-status-bar
   npx expo install date-fns
   ```
   
2. Pasos para la instalación
   Instalar Visual Studio Code, con la implementación de Git y React Native
   Instalar Android Studio
   En VSCode usar consola del tipo Git Bash y ejecutar:
      git clone https://github.com/esaucruzbird/MiAppEventos.git
   Crear branch de colaboración para poder agregar los cambios realizados en Github
   Ya teniendo creada su rama, puede comenzar a revisar el código e implementarle mejoras, ejecutarlo con el comando de la siguiente sección
   Abrir emulador de Android Studio, se recomienda el modelo Google Pixel 7 por eficiencia, fluidez y launcher más limpio para no sobrecargar los recursos de la PC
   
4. Para lanzar la aplicación limpiando la caché, para evitar situaciones raras

   ```bash
   npx expo start -c
   ```

Para ver los resultados, hay diferentes opciones para ejecutar la aplicación

- [Emulador en Android Studio](https://docs.expo.dev/workflow/android-studio-emulator/)
- [Usar la aplicación de Expo Go](https://expo.dev/go), es posible escanear el QR para lanzar la App en Expo en un dispositivo físico

## Para conocer más sobre desarrollo de Expo
Para obtener más información sobre cómo desarrollar su proyecto con Expo, consulte los siguientes recursos

- [Documentación de Expo](https://docs.expo.dev/): Aprenda los conceptos básicos o profundice en temas avanzados con la información [guías](https://docs.expo.dev/guides)
- [Tutoriales con Expo](https://docs.expo.dev/tutorial/introduction/): Para ver un tutorial paso a paso en el que se crea un proyecto que se ejecuta en Android, iOS y web

## Licenciamiento

El proyecto utiliza la licencia Atribución-NoComercial-CompartirIgual 4.0 Internacional (CC BY-NC-SA 4.0), la cual establece que:
El interesado es libre de: compartir, copiar y redistribuir el material en cualquier medio o formato, de adaptar o remezclar, transformar y construir a partir del material. La licenciante no puede revocar estas libertades en tanto usted siga los términos establecidos con anterioridad.

## Autor/es
   Josué Esaú Cruz Mejía - Estudiante UDB Virtual - CM221973

## Documentación solicitada
- [Reporte escrito](https://drive.google.com/file/d/1lg9F3yZJ6aprhilaO6QpxLtSrdkj4M13/view?usp=sharing)
- [Tablero de Trello](https://trello.com/invite/b/6923f33f42c21dc3dc9791b3/ATTI5f9b2664d54783248e352030a7b9b16eB1EE9EC9/dps-proyecto-2-cm221973)
- [Mock Ups](https://drive.google.com/file/d/1bIO3pJtZCS-glM0VXdcPudJ6piNKyXT3/view?usp=sharing)

>>>>>>> Para futuras referencias, el commit inicial de este proyecto fue: 61bc1c8
