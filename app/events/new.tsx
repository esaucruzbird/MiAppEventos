// app/events/new.tsx
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import EventFormScreen from '../../src/screens/EventFormScreen';

export default function EventNewPage() {
  const params = useLocalSearchParams();
  const id = params?.id ?? null; // puede venir undefined si es crear nuevo
  return <EventFormScreen id={id} />;
}
