import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EventCard from '../components/EventCard';
import { getPastEvents } from '../services/eventsService';

export default function HistoryScreen() {
  const [events, setEvents] = useState([]);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ev = await getPastEvents();
        if (!mounted) return;
        setEvents(ev);
      } catch (e) {
        console.warn('getPastEvents error', e);
      }
    })();
    return () => (mounted = false);
  }, []);

  function handlePress(event) {
    router.push(`/events/${event.id}`);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top','left','right']}>
      <View style={styles.container}>
        <Text style={styles.header}>Historial — Eventos finalizados</Text>

        <FlatList
          data={events}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            // se reutiliza EventCard, pero pasamos isAdmin false (para no edicion desde historial)
            <TouchableOpacity onPress={() => handlePress(item)}>
              <EventCard
                event={item}
                onPress={() => handlePress(item)}
                onEdit={() => {}}
                onDelete={() => {}}
                onToggleRSVP={() => {}}
                userIsGoing={(item.attendees || []).includes(/* no hace falta */'')}
                isAdmin={false}
              />
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ color:'#666', marginTop:12 }}>No hay eventos finalizados aún.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFB' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 8 }
});
