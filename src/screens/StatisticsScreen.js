// src/screens/StatisticsScreen.js
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAverageRating, getPastEvents } from '../services/eventsService';

export default function StatisticsScreen() {
  const [stats, setStats] = useState([]); // [{ id, name, avg, count }]
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const events = await getPastEvents();
        // calcular averages en paralelo
        const rows = await Promise.all(events.map(async ev => {
          const { avg, count } = await getAverageRating(ev.id);
          return { id: ev.id, name: ev.name, avg, count };
        }));
        if (!mounted) return;
        setStats(rows);
      } catch (e) {
        console.warn('StatisticsScreen error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top','left','right']}>
      <View style={styles.container}>
        <Text style={styles.header}>Estadísticas — Promedio de calificaciones</Text>

        {loading ? <Text style={{ marginTop: 12 }}>Cargando...</Text> : (
          <FlatList
            data={stats}
            keyExtractor={i => i.id}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventName}>{item.name}</Text>
                  <Text style={styles.sub}>Reseñas: {item.count ?? 0}</Text>
                </View>
                <View style={styles.avgBox}>
                  <Text style={styles.avgText}>
                    {item.count > 0 ? (Number(item.avg).toFixed(2)) : '—'}
                  </Text>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={{ color:'#666', marginTop:12 }}>No hay eventos finalizados.</Text>}
          />
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  eventName: { fontWeight: '600' },
  sub: { color: '#666', marginTop: 4 },
  avgBox: { width: 70, height: 40, borderRadius: 8, backgroundColor: '#f4f8ff', alignItems: 'center', justifyContent: 'center' },
  avgText: { fontWeight: '700', fontSize: 16 }
});
