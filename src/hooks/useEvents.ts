import { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";

export const useEvents = (includeDrafts = false) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const q = query(collection(db, 'events'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isMounted) {
        try {
          let eventsList: any[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          if (!includeDrafts) {
            eventsList = eventsList.filter(e => e.status !== 'draft');
          }
          
          // Sort by date ascending
          eventsList.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          setEvents(eventsList);
          setError(null);
        } catch (err) {
          setError("Error procesando los eventos.");
        } finally {
          setLoading(false);
        }
      }
    }, (error) => {
      if (isMounted) {
        console.error("Firestore error:", error);
        setError("Error de red. No se pudieron cargar los eventos.");
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [includeDrafts]);

  return { events, loading, error };
};
