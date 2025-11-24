export function isPast(date) {
  
  if (!date) return false;
  const d = date?.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  return d < now;
}

export function formatDateTime(date) {
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleString();
}