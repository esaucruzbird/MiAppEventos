// src/services/eventsService.js
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
import { db } from '../api/firebase'; // tu archivo existing: ../api/firebase

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

// ----- REVIEWS (subcolección events/{eventId}/reviews/{uid}) -----

/**
 * Submit or update a review by a user for an event.
 * The document id for the review is the uid => ensures one review per user per event.
 */

/**
 * Guarda o actualiza la reseña de `uid` para el evento `eventId`.
 * El documento se almacenará en: events/{eventId}/reviews/{uid}
 * Usamos setDoc(..., {merge:true}) para crear si no existe o actualizar si existe.
 */
export async function submitReview(eventId, uid, comment, rating, name = null) {
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
}

// helper fallback using set via addDoc-like: we use setDoc by importing it
async function setDocFallback(eventId, uid, payload) {
  const rRef = doc(db, 'events', eventId, 'reviews', uid);
  await rRef && rRef; // placeholder
  // we can't import setDoc here if not present; better do direct set with updateDoc fallback above.
}

/**
 * Obtiene la reseña del usuario `uid` para el evento `eventId`.
 * Devuelve null si no existe.
 */
export async function getUserReview(eventId, uid) {
  try {
    const ref = doc(db, 'events', eventId, 'reviews', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error('getUserReview error', err);
    throw err;
  }
}

/**
 * Obtiene todas las reseñas del evento, ordenadas por createdAt (desc).
 */
export async function getReviews(eventId) {
  try {
    const col = collection(db, 'events', eventId, 'reviews');
    const q = query(col, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('getReviews error', err);
    throw err;
  }
}

// check if event date is in the past given event object or timestamp
export function isEventPast(eventOrDate) {
  if (!eventOrDate) return false;
  const dateField = eventOrDate?.date ? eventOrDate.date : eventOrDate;
  const dateObj = dateField?.toDate ? dateField.toDate() : new Date(dateField);
  const now = new Date();
  return dateObj < now;
}
