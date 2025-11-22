// src/services/eventsService.js
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../api/firebase'; // tu archivo existing: ../api/firebase

const eventsCol = collection(db, 'events');
const usersCol = collection(db, 'users');

export function subscribeEvents(onChange) {
  const q = query(eventsCol, orderBy('date', 'asc'));
  return onSnapshot(q, snapshot => {
    const events = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
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
