import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import EventDetailsScreen from '../../src/screens/EventDetailsScreen';

export default function EventDetailsPage() {
  const params = useLocalSearchParams();
  const id = params?.id ?? params?.['id'] ?? null; // por seguridad
  return <EventDetailsScreen id={id} />;
}
