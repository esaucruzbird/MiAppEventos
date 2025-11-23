// src/screens/EventDetailsScreen.js
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../api/firebase';
import { addAttendeeByUid, getEventById, getUsersByUids, isUserAdmin, removeAttendeeByUid } from '../services/eventsService';

function formatDateTime(date) {
  const d = date?.toDate ? date.toDate() : new Date(date);
  return format(d, "yyyy-MM-dd HH:mm");
}

export default function EventDetailsScreen({ id: propId }) {
  const id = propId ?? null;
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]); // [{uid, name}]
  const [inputUid, setInputUid] = useState('');
  const [admin, setAdmin] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      const e = await getEventById(id);
      if (!e) return;
      if (!mounted) return;
      setEvent(e);

      const uids = e.attendees || [];
      const users = await getUsersByUids(uids);
      setAttendees(users);
    })();

    return () => (mounted = false);
  }, [id]);

  useEffect(() => {
    async function check() {
      if (!user) return setAdmin(false);
      const a = await isUserAdmin(user.uid);
      setAdmin(a);
    }
    check();
  }, [user]);

  async function handleAddByUid() {
    const uid = inputUid.trim();
    if (!uid) return Alert.alert('UID requerido');
    try {
      await addAttendeeByUid(id, uid);
      const updatedUids = [...(event.attendees || []), uid];
      setEvent({ ...event, attendees: updatedUids });
      const users = await getUsersByUids(updatedUids);
      setAttendees(users);
      setInputUid('');
    } catch (e) {
      console.warn(e);
      Alert.alert('Error', 'No se pudo agregar el asistente');
    }
  }

  async function handleRemoveByUid() {
    const uid = inputUid.trim();
    if (!uid) return Alert.alert('UID requerido');
    try {
      await removeAttendeeByUid(id, uid);
      const updatedUids = (event.attendees || []).filter(u => u !== uid);
      setEvent({ ...event, attendees: updatedUids });
      const users = await getUsersByUids(updatedUids);
      setAttendees(users);
      setInputUid('');
    } catch (e) {
      console.warn(e);
      Alert.alert('Error', 'No se pudo eliminar el asistente');
    }
  }

  if (!event) return <SafeAreaView style={styles.safe} edges={['top','left','right']}><View style={styles.loading}><Text>Cargando...</Text></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe} edges={['top','left','right']}>
      <View style={styles.container}>
        <Text style={styles.title}>{event.name}</Text>
        <Text style={styles.date}>{formatDateTime(event.date)}</Text>
        <Text style={styles.location}>{event.location}</Text>
        <Text style={styles.desc}>{event.description}</Text>

        <Text style={styles.subtitle}>Asistentes <Text style={styles.count}>({(event.attendees || []).length})</Text></Text>
        <FlatList
          data={attendees}
          keyExtractor={(item) => item.uid}
          style={{ marginTop: 8 }}
          renderItem={({ item }) => (
            <View style={styles.attendeeRow}>
              <Text style={styles.attendeeText}>{item.name ? item.name : item.uid}</Text>
              <Text style={styles.attendeeUid}>{item.uid}</Text>
            </View>
          )}
        />

        {admin && (
          <View style={styles.adminBox}>
            <Text style={styles.adminTitle}>Administrar asistentes por UID</Text>
            <TextInput
              placeholder="UID del usuario"
              value={inputUid}
              onChangeText={setInputUid}
              style={styles.input}
            />
            <View style={styles.adminButtons}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Button title="Agregar por UID" onPress={handleAddByUid} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Eliminar por UID" color="#d9534f" onPress={handleRemoveByUid} />
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  date: { marginTop: 6, color: '#555' },
  location: { marginTop: 6, color: '#444' },
  desc: { marginTop: 12, color: '#333' },
  subtitle: { marginTop: 18, fontWeight: '700', fontSize: 16 },
  count: { fontWeight: '500', color: '#666', fontSize: 14 },
  attendeeRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'column' },
  attendeeText: { fontSize: 15, color: '#222' },
  attendeeUid: { fontSize: 12, color: '#888', marginTop: 4 },
  adminBox: { marginTop: 18, padding: 12, backgroundColor: '#f9f9fb', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  adminTitle: { fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginBottom: 8 },
  adminButtons: { flexDirection: 'row' }
});
