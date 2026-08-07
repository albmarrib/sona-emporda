import { useState, useEffect } from "react";
import { mockEvents } from "../data/mockEvents";
import type { SonaEvent } from "../data/mockEvents";

export const useEvents = () => {
  const [events, setEvents] = useState<SonaEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchEvents = async () => {
      setLoading(true);
      try {
        // Simular latencia de red de Firestore (ej. 800ms)
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        // En Fase 2, aquí iría:
        // const snapshot = await getDocs(collection(db, 'events'));
        // const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (isMounted) {
          setEvents(mockEvents);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError("Error al cargar los eventos. Por favor, inténtalo de nuevo.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  return { events, loading, error };
};
