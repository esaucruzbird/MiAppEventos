// src/screens/EventsListScreen.js
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../api/firebase';
import EventCard from '../components/EventCard';
import { deleteEvent, isUserAdmin, subscribeEvents, toggleRSVP } from '../services/eventsService';

export default function EventsListScreen() {
  const [events, setEvents] = useState([]);
  const [admin, setAdmin] = useState(false);
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    const unsub = subscribeEvents(ev => setEvents(ev));
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    async function check() {
      if (!user) return setAdmin(false);
      const a = await isUserAdmin(user.uid);
      setAdmin(a);
    }
    check();
  }, [user]);

  function handlePress(event) {
    router.push(`/events/${event.id}`);
  }

  function handleEdit(event) {
    router.push(`/events/new?id=${event.id}`);
  }

  function handleDelete(event) {
    Alert.alert('Eliminar evento', `¿Eliminar "${event.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await deleteEvent(event.id);
        } catch (e) {
          console.warn(e);
          Alert.alert('Error', 'No se pudo eliminar el evento');
        }
      } }
    ]);
  }

  async function handleToggleRSVP(event) {
    if (!user) return router.push('/login');
    const going = (event.attendees || []).includes(user.uid);
    try {
      await toggleRSVP(event.id, user.uid, !going);
    } catch (e) {
      console.warn(e);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>Eventos</Text>
          {admin && (
            <TouchableOpacity onPress={() => router.push('/events/new')} style={styles.createBtn}>
              <Text style={styles.createBtnText}>Crear</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={events}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={handlePress}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleRSVP={() => handleToggleRSVP(item)}
              userIsGoing={(item.attendees || []).includes(user?.uid)}
              isAdmin={admin}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFB' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  header: { fontSize: 22, fontWeight: '700', color: '#222' },
  createBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#2b8aef', borderRadius: 8 },
  createBtnText: { color: '#fff', fontWeight: '600' },
});
