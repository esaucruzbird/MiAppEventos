// src/screens/EventFormScreen.js
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { createEvent, getEventById, updateEvent } from '../services/eventsService';

// helper formato dd/mm/yyyy hh:mm
function pad(n) { return String(n).padStart(2, '0'); }
function formatDateTimeForDisplay(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : (date?.toDate ? date.toDate() : new Date(date));
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventFormScreen({ id: propId }) {
  const router = useRouter();
  const id = propId ?? null;

  const [name, setName] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false); // solo usado en iOS
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (id) {
        const e = await getEventById(id);
        if (!e) return;
        if (!mounted) return;
        // e.date puede ser Timestamp de Firestore
        setName(e.name || '');
        setDateTime(e.date?.toDate ? e.date.toDate() : new Date(e.date));
        setLocation(e.location || '');
        setDescription(e.description || '');
      }
    })();
    return () => (mounted = false);
  }, [id]);

  // Abrir picker (plataforma específica)
  async function handleOpenPicker() {
    if (Platform.OS === 'android') {
      // En Android abrimos primero selector de fecha y luego de hora
      DateTimePickerAndroid.open({
        value: dateTime,
        onChange: (event, selectedDate) => {
          // si el usuario dismiss, event.type === 'dismissed' (no hacemos nada)
          if (!selectedDate || event?.type === 'dismissed') {
            return;
          }
          // selectedDate contiene la fecha; ahora abrimos time picker
          const chosenDate = selectedDate;
          DateTimePickerAndroid.open({
            value: chosenDate,
            mode: 'time',
            is24Hour: true,
            onChange: (ev2, selectedTime) => {
              if (!selectedTime || ev2?.type === 'dismissed') {
                // si canceló time, no actualizamos
                return;
              }
              const final = new Date(chosenDate);
              final.setHours(selectedTime.getHours(), selectedTime.getMinutes());
              setDateTime(final);
            },
          });
        },
        mode: 'date',
      });
    } else {
      // iOS: mostrar inline DateTimePicker en la UI
      setShowPicker(true);
    }
  }

  async function handleSave() {
    if (!name) return Alert.alert('Nombre requerido');
    setLoading(true);
    const payload = { name, date: dateTime, location, description };
    try {
      if (id) {
        await updateEvent(id, payload);
      } else {
        await createEvent(payload);
      }
      router.back();
    } catch (e) {
      console.warn(e);
      Alert.alert('Error', 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text>Nombre</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} />

      <Text>Fecha y hora</Text>
      <Button title={formatDateTimeForDisplay(dateTime)} onPress={handleOpenPicker} />

      {showPicker && Platform.OS !== 'android' && (
        <DateTimePicker
          value={dateTime}
          mode="datetime"
          display="default"
          onChange={(e, d) => {
            // iOS envía selected date; cuando se cierre, ocultamos el picker
            if (d) setDateTime(d);
            // en iOS queremos mantenerlo oculto tras selección
            setShowPicker(false);
          }}
        />
      )}

      <Text>Ubicación</Text>
      <TextInput value={location} onChangeText={setLocation} style={styles.input} />

      <Text>Descripción</Text>
      <TextInput value={description} onChangeText={setDescription} style={[styles.input, { height: 100 }]} multiline />

      <Button title={loading ? 'Guardando...' : 'Guardar'} onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginBottom: 12 }
});
