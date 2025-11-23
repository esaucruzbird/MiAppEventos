// src/screens/EventDetailsScreen.js
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
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
      // actualizar lista localmente (opcional: refetch)
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

  if (!event) return <View style={styles.container}><Text>Cargando...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{event.name}</Text>
      <Text style={styles.date}>{formatDateTime(event.date)}</Text>
      <Text style={styles.location}>{event.location}</Text>
      <Text style={styles.desc}>{event.description}</Text>

      <Text style={styles.subtitle}>Asistentes ({(event.attendees || []).length})</Text>
      <FlatList
        data={attendees}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 6 }}>
            <Text>{item.uid} {item.name ? `: ${item.name}` : ''}</Text>
          </View>
        )}
      />

      {admin && (
        <>
          <Text style={{ marginTop: 12, fontWeight: '700' }}>Administrar asistentes por UID</Text>
          <TextInput
            placeholder="UID del usuario"
            value={inputUid}
            onChangeText={setInputUid}
            style={{ borderWidth: 1, padding: 8, marginTop: 8, borderRadius: 6 }}
          />
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Button title="Agregar por UID" onPress={handleAddByUid} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Eliminar por UID" color="red" onPress={handleRemoveByUid} />
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  date: { marginTop: 6 },
  location: { marginTop: 6 },
  desc: { marginTop: 12 },
  subtitle: { marginTop: 18, fontWeight: '700' },
});
