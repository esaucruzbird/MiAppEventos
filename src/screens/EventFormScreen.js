import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createEvent, getEventById, updateEvent } from '../services/eventsService';

// helper para formato dd/mm/yyyy hh:mm
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
        setName(e.name || '');
        setDateTime(e.date?.toDate ? e.date.toDate() : new Date(e.date));
        setLocation(e.location || '');
        setDescription(e.description || '');
      }
    })();
    return () => (mounted = false);
  }, [id]);

  async function handleOpenPicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dateTime,
        onChange: (event, selectedDate) => {
          if (!selectedDate || event?.type === 'dismissed') {
            return;
          }
          const chosenDate = selectedDate;
          DateTimePickerAndroid.open({
            value: chosenDate,
            mode: 'time',
            is24Hour: true,
            onChange: (ev2, selectedTime) => {
              if (!selectedTime || ev2?.type === 'dismissed') {
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
    <SafeAreaView style={styles.safe} edges={['top','left','right']}>
      <View style={styles.container}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} />

        <Text style={styles.label}>Fecha y hora</Text>
        <Button title={formatDateTimeForDisplay(dateTime)} onPress={handleOpenPicker} />

        {showPicker && Platform.OS !== 'android' && (
          <DateTimePicker
            value={dateTime}
            mode="datetime"
            display="default"
            onChange={(e, d) => {
              if (d) setDateTime(d);
              setShowPicker(false);
            }}
          />
        )}

        <Text style={styles.label}>Ubicación</Text>
        <TextInput value={location} onChangeText={setLocation} style={styles.input} />

        <Text style={styles.label}>Descripción</Text>
        <TextInput value={description} onChangeText={setDescription} style={[styles.input, { height: 100 }]} multiline />

        <View style={{ marginTop: 8 }}>
          <Button title={loading ? 'Guardando...' : 'Guardar'} onPress={handleSave} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  label: { marginBottom: 6, color: '#444', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#eee', padding: 10, borderRadius: 8, marginBottom: 12, backgroundColor: '#fff' },
});
