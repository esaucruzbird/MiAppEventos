import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../api/firebase';
import {
  addAttendeeByUid,
  getEventById,
  getReviews,
  getUserReview,
  getUsersByUids,
  isUserAdmin,
  removeAttendeeByUid,
  submitReview,
} from '../services/eventsService';
import { isPast } from '../utils/date';

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
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState('');
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

      // cargar reseñas
      const revs = await getReviews(id);
      setReviews(revs);

      if (user) {
        const myRev = await getUserReview(id, user.uid);
        setUserReview(myRev);
      }
    })();

    return () => (mounted = false);
  }, [id, user]);

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

  const userIsAttendee = user && (event?.attendees || []).includes(user.uid);
  const eventIsPast = isPast(event?.date);

  // submit review (create or update)
  async function handleSubmitReview() {
    if (!user) return Alert.alert('Debes iniciar sesión para dejar un comentario');
    if (!userIsAttendee) return Alert.alert('Solo asistentes pueden dejar reseñas');
    if (!eventIsPast) return Alert.alert('El evento aún no ha terminado');
    const r = Number(rating);
    if (!comment || comment.trim().length < 3) return Alert.alert('Comentario muy corto');
    if (!r || r < 1 || r > 10) return Alert.alert('La calificación debe ser entre 1 y 10');
    try {
      await submitReview(id, user.uid, comment.trim(), r, user.displayName || null);
      Alert.alert('Gracias', 'Tu reseña ha sido guardada');
      // refrescar lista
      const revs = await getReviews(id);
      setReviews(revs);
      const myRev = await getUserReview(id, user.uid);
      setUserReview(myRev);
      setComment('');
      setRating('');
    } catch (e) {
      console.warn(e);
      Alert.alert('Error', 'No se pudo enviar la reseña');
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
          style={{ marginTop: 8, maxHeight: 200 }}
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

        {/* seccion para comentarios */}
        <View style={{ marginTop: 18 }}>
          <Text style={styles.subtitle}>Reseñas</Text>

          {eventIsPast && userIsAttendee ? (
            <>
              {!userReview ? (
                <View style={styles.reviewForm}>
                  <Text style={{ marginBottom: 6 }}>Tu calificación (1-10)</Text>
                  <TextInput
                    placeholder="Ej: 8"
                    value={rating}
                    onChangeText={setRating}
                    keyboardType="numeric"
                    style={[styles.input, { width: 120 }]}
                  />
                  <Text style={{ marginTop: 8, marginBottom: 6 }}>Tu comentario</Text>
                  <TextInput
                    placeholder="Escribe tu comentario..."
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    numberOfLines={4}
                    style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                  />
                  <Button title="Enviar reseña" onPress={handleSubmitReview} />
                </View>
              ) : (
                <View style={[styles.reviewBox, { marginTop: 8 }]}>
                  <Text style={{ fontWeight: '700' }}>{userReview.name || userReview.uid} — {userReview.rating}/10</Text>
                  <Text style={{ marginTop: 6 }}>{userReview.comment}</Text>
                  <Text style={{ marginTop: 6, fontSize: 12, color: '#666' }}>Enviado: {userReview.createdAt?.toDate ? userReview.createdAt.toDate().toLocaleString() : ''}</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={{ color: '#666', marginTop: 8 }}>Sólo los asistentes pueden dejar reseñas después de finalizado el evento.</Text>
          )}

          {/* Lista pública de reseñas */}
          <View style={{ marginTop: 12 }}>
            {reviews.length === 0 ? <Text style={{ color: '#666' }}>Aún no hay reseñas</Text> : (
              <FlatList
                data={reviews}
                keyExtractor={(it) => it.id}
                renderItem={({ item }) => (
                  <View style={styles.reviewBox}>
                    <Text style={{ fontWeight: '700' }}>{item.name || item.uid} — {item.rating}/10</Text>
                    <Text style={{ marginTop: 6 }}>{item.comment}</Text>
                    <Text style={{ marginTop: 6, fontSize: 12, color: '#666' }}>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : ''}</Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>

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
  attendeeRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  attendeeText: { fontSize: 15, color: '#222' },
  attendeeUid: { fontSize: 12, color: '#888', marginTop: 4 },
  adminBox: { marginTop: 18, padding: 12, backgroundColor: '#f9f9fb', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  adminTitle: { fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginBottom: 8, backgroundColor: '#fff' },
  adminButtons: { flexDirection: 'row' },
  reviewForm: { marginTop: 8 },
  reviewBox: { padding: 12, borderRadius: 8, backgroundColor: '#fbfbfd', borderWidth: 1, borderColor: '#eee', marginBottom: 10 }
});
