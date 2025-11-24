import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { isPast } from '../utils/date';

export default function EventCard({ event, onPress, onEdit, onDelete, onToggleRSVP, userIsGoing, isAdmin }) {
  const past = isPast(event.date);
  return (
    <TouchableOpacity onPress={() => onPress(event)} style={[styles.card, past && styles.pastCard]}>
      <View style={styles.row}>
        <Text style={[styles.title, past && styles.pastText]}>{event.name}</Text>
        {/*<Text style={[styles.date, past && styles.pastText]}>{formatDateTime(event.date)}</Text>*/}
        <Text style={[styles.date, past && styles.pastText]}>
          {event.date?.toDate ? event.date.toDate().toLocaleString() : new Date(event.date).toLocaleString()}
        </Text>
      </View>
      <Text style={[styles.location, past && styles.pastText]}>{event.location}</Text>
      <Text numberOfLines={2} style={[styles.desc, past && styles.pastText]}>
        {event.description}
      </Text>

      <View style={styles.actions}>
        {/*<TouchableOpacity onPress={() => onToggleRSVP(event)} style={styles.btn}>*/}
        {/*<Text>{userIsGoing ? 'No podré' : 'Asistiré'}</Text>*/}
        {/*</TouchableOpacity>*/}
        <TouchableOpacity
          disabled={past}
          onPress={() => {
            if (!past) onToggleRSVP(event);
          }}
          style={[styles.btn, past && styles.btnDisabled]}
        >
          <Text style={past ? styles.btnTextDisabled : styles.btnText}>
            {past ? 'Evento finalizado' : userIsGoing ? 'No podré' : 'Asistiré'}
          </Text>
        </TouchableOpacity>

        {isAdmin && (
          <View style={styles.adminBtns}>
            <TouchableOpacity onPress={() => onEdit(event)} style={styles.btnSecondary}>
              <Text>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(event)} style={styles.btnDanger}>
              <Text>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 12, marginVertical: 6, borderRadius: 8, elevation: 2 },
  pastCard: { backgroundColor: '#f0f0f0' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontWeight: '700', fontSize: 16 },
  date: { fontSize: 12 },
  location: { fontSize: 13, marginTop: 6 },
  desc: { fontSize: 13, marginTop: 6, color: '#333' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' },
  btn: { padding: 8, borderRadius: 6, backgroundColor: '#e2e2e2' },
  btnText: { color: '#111' },
  btnDisabled: { backgroundColor: '#ddd' },
  btnTextDisabled: { color: '#777' },
  adminBtns: { flexDirection: 'row' },
  btnSecondary: { padding: 8, borderRadius: 6, marginLeft: 8, backgroundColor: '#eaf2ff' },
  btnDanger: { padding: 8, borderRadius: 6, marginLeft: 8, backgroundColor: '#ffdede' },
  pastText: { color: '#777' },
});
