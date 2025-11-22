// src/screens/EventDetailsScreen.js
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { getEventById } from '../services/eventsService';

function formatDateTime(date) {
  const d = date?.toDate ? date.toDate() : new Date(date);
  return format(d, "yyyy-MM-dd HH:mm");
}

export default function EventDetailsScreen({ id: propId }) {
  const id = propId ?? null;
  const [event, setEvent] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      const e = await getEventById(id);
      if (mounted) setEvent(e);
    })();
    return () => (mounted = false);
  }, [id]);

  if (!event) return <View style={styles.container}><Text>Cargando...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{event.name}</Text>
      <Text style={styles.date}>{formatDateTime(event.date)}</Text>
      <Text style={styles.location}>{event.location}</Text>
      <Text style={styles.desc}>{event.description}</Text>

      <Text style={styles.subtitle}>Asistentes ({(event.attendees || []).length})</Text>
      <FlatList
        data={event.attendees || []}
        keyExtractor={(u) => u}
        renderItem={({ item }) => <Text style={styles.attendee}>{item}</Text>}
      />
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
  attendee: { paddingVertical: 6 }
});
