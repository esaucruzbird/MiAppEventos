import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../api/firebase';

const eventsCol = collection(db, 'events');
const usersCol = collection(db, 'users');

export function subscribeEvents(onChange) {
  const q = query(eventsCol, orderBy('date', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    onChange(events);
  });
}

export async function createEvent(event) {
  const docRef = await addDoc(eventsCol, {
    name: event.name,
    date: event.date, // JS Date (Firestore lo convierte)
    location: event.location || '',
    description: event.description || '',
    attendees: [], // array de uids
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateEvent(eventId, changes) {
  const d = doc(db, 'events', eventId);
  await updateDoc(d, changes);
}

export async function deleteEvent(eventId) {
  const d = doc(db, 'events', eventId);
  await deleteDoc(d);
}

export async function toggleRSVP(eventId, uid, going) {
  const d = doc(db, 'events', eventId);
  if (going) {
    await updateDoc(d, { attendees: arrayUnion(uid) });
  } else {
    await updateDoc(d, { attendees: arrayRemove(uid) });
  }
}

export async function getEventById(id) {
  const d = doc(db, 'events', id);
  const s = await getDoc(d);
  if (!s.exists()) return null;
  return { id: s.id, ...s.data() };
}

export async function isUserAdmin(uid) {
  try {
    const d = doc(db, 'users', uid);
    const s = await getDoc(d);
    if (!s.exists()) return false;
    const data = s.data();
    return data.role === 'admin';
  } catch (e) {
    console.warn('isUserAdmin error', e);
    return false;
  }
}

export async function getUsersByUids(uids = []) {
  try {
    if (!uids || uids.length === 0) return [];

    const batches = [];
    const results = [];

    // Firestore 'in' acepta máximo 10 elementos, por eso batch de 10
    for (let i = 0; i < uids.length; i += 10) {
      const slice = uids.slice(i, i + 10);
      const q = query(collection(db, 'users'), where(documentId(), 'in', slice));
      batches.push(getDocs(q));
    }

    const snaps = await Promise.all(batches);
    snaps.forEach(snap => {
      snap.forEach(docSnap => {
        results.push({ uid: docSnap.id, ...(docSnap.data() || {}) });
      });
    });

    // Mantener el orden original de uids
    const map = new Map(results.map(r => [r.uid, r]));
    return uids.map(uid => map.get(uid) || { uid, name: null });
  } catch (err) {
    console.warn('getUsersByUids error', err);
    // si falla la consulta, devolvemos los uids para no romper la UI
    return uids.map(uid => ({ uid, name: null }));
  }
}

// --- Añadir asistente (por UID) al evento
export async function addAttendeeByUid(eventId, uid) {
  const evRef = doc(db, 'events', eventId);
  // añade uid (evita duplicados)
  await updateDoc(evRef, { attendees: arrayUnion(uid) });
}

// --- Eliminar asistente (por UID)
export async function removeAttendeeByUid(eventId, uid) {
  const evRef = doc(db, 'events', eventId);
  await updateDoc(evRef, { attendees: arrayRemove(uid) });
}

// ----- para las Reviews en firestore (subcolección events/{eventId}/reviews/{uid}) -----

/**
 * Guardar o actualizar la reseña de `uid` para el evento `eventId`
 * El documento se almacenará en: events/{eventId}/reviews/{uid}
 * Usar setDoc(..., {merge:true}) para crear si no existe o actualizar si existe
 */
/*export async function submitReview(eventId, uid, comment, rating, name = null) {
  try {
    const ref = doc(db, 'events', eventId, 'reviews', uid);
    await setDoc(ref, {
      uid,
      name: name || null,
      comment,
      rating: Number(rating),
      createdAt: serverTimestamp()
    }, { merge: true }); // merge = true para no sobrescribir campos adicionales
    return true;
  } catch (err) {
    console.error('submitReview error', err);
    throw err;
  }
}*/

/**
 * submitReview: guarda/actualiza la reseña para eventId/uid
 * Se asegura de guardar el campo `name` si se puede obtener
 */
export async function submitReview(eventId, uid, comment, rating, name = null) {
  try {
    // Si no nos da el name, intentamos obtenerlo desde users/{uid}
    let finalName = name || null;
    if (!finalName) {
      try {
        const uRef = doc(db, 'users', uid);
        const uSnap = await getDoc(uRef);
        if (uSnap.exists()) {
          finalName = uSnap.data().name || uSnap.data().displayName || null;
        }
      } catch (e) {
        console.warn('submitReview: no se pudo obtener name de users/{uid}', e);
      }
    }

    const ref = doc(db, 'events', eventId, 'reviews', uid);
    await setDoc(ref, {
      uid,
      name: finalName,
      comment,
      rating: Number(rating),
      createdAt: serverTimestamp()
    }, { merge: true });

    return true;
  } catch (err) {
    console.error('submitReview error', err);
    throw err;
  }
}

async function setDocFallback(eventId, uid, payload) {
  const rRef = doc(db, 'events', eventId, 'reviews', uid);
  await rRef && rRef; // placeholder
}

/**
 * Obtiene la reseña del usuario `uid` para el evento `eventId`
 * Devuelve null si no existe
 */
/*export async function getUserReview(eventId, uid) {
  try {
    const ref = doc(db, 'events', eventId, 'reviews', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error('getUserReview error', err);
    throw err;
  }
}*/

/**
 * getUserReview: obtiene la review del usuario para un evento y si le falta `name`
 * intenta completarlo desde users/{uid}
 */
export async function getUserReview(eventId, uid) {
  try {
    const ref = doc(db, 'events', eventId, 'reviews', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = { id: snap.id, ...snap.data() };

    // si no tiene name, intenta completarlo desde users collection
    if (!data.name) {
      try {
        const uRef = doc(db, 'users', uid);
        const uSnap = await getDoc(uRef);
        if (uSnap.exists()) {
          data.name = uSnap.data().name || uSnap.data().displayName || null;
        }
      } catch (e) {
        console.warn('getUserReview: no pudo obtener name desde users/', e);
      }
    }
    return data;
  } catch (err) {
    console.error('getUserReview error', err);
    throw err;
  }
}

/**
 * Obtiene todas las reseñas del evento, ordenadas por createdAt (desc)
 */
/*export async function getReviews(eventId) {
  try {
    const col = collection(db, 'events', eventId, 'reviews');
    const q = query(col, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('getReviews error', err);
    throw err;
  }
}*/

/**
 * getReviews: obtiene todas las reviews de un evento y completa el field `name`
 * para aquellos docs que no lo tengan, en batch usando getUsersByUids (máx 10 por batch)
 */
export async function getReviews(eventId) {
  try {
    const col = collection(db, 'events', eventId, 'reviews');
    const q = query(col, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // detectar cuales reviews no tienen name
    const missingUids = reviews.filter(r => !r.name).map(r => r.id);
    if (missingUids.length === 0) {
      return reviews;
    }

    // OJO: usar la función getUsersByUids (batch) para obtener nombres, se asume que viene bien
    const users = await getUsersByUids(missingUids); // devuelve [{ uid, name, ...}, ...]
    const userMap = new Map(users.map(u => [u.uid, u]));

    // completar names en reviews
    const enriched = reviews.map(r => {
      if (r.name) return r;
      const u = userMap.get(r.id);
      return { ...r, name: u?.name || u?.displayName || null };
    });

    return enriched;
  } catch (err) {
    console.error('getReviews error', err);
    throw err;
  }
}

export function isEventPast(eventOrDate) {
  if (!eventOrDate) return false;
  const dateField = eventOrDate?.date ? eventOrDate.date : eventOrDate;
  const dateObj = dateField?.toDate ? dateField.toDate() : new Date(dateField);
  const now = new Date();
  return dateObj < now;
}

// Obtener eventos pasados (fecha < ahora)
export async function getPastEvents() {
  try {
    // Firestore permite comparar con Date()
    const now = new Date();
    const col = collection(db, 'events');
    const q = query(col, where('date', '<', now), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('getPastEvents error (fallback to client filter)', err);
    // fallback: leer todos y filtrar en cliente si la query falla
    const allSnap = await getDocs(collection(db, 'events'));
    const all = allSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const now = new Date();
    return all.filter(e => {
      const evDate = e.date?.toDate ? e.date.toDate() : new Date(e.date);
      return evDate < now;
    }).sort((a,b) => new Date(b.date?.toDate ? b.date.toDate() : b.date) - new Date(a.date?.toDate ? a.date.toDate() : a.date));
  }
}

// --- Calcular promedio de calificaciones (reviews subcollection)
// devuelve { avg: number|null, count: number }
export async function getAverageRating(eventId) {
  try {
    const col = collection(db, 'events', eventId, 'reviews');
    const snap = await getDocs(col);
    if (snap.empty) return { avg: null, count: 0 };
    let sum = 0;
    let count = 0;
    snap.forEach(doc => {
      const data = doc.data();
      if (typeof data.rating === 'number') {
        sum += data.rating;
        count++;
      } else if (data.rating) {
        const n = Number(data.rating);
        if (!isNaN(n)) { sum += n; count++; }
      }
    });
    return { avg: count > 0 ? (sum / count) : null, count };
  } catch (err) {
    console.warn('getAverageRating error', err);
    return { avg: null, count: 0 };
  }
}
