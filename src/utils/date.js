export function isPast(date) {
  // date is a JS Date object or Firestore Timestamp with toDate()
  const d = date?.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  return d < now;
}

export function formatDateTime(date) {
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleString();
}