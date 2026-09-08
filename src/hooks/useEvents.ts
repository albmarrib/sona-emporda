import { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";

export const useEvents = (includeDrafts = false, includePrivate = false) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const q = query(collection(db, 'events'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isMounted) {
        try {
          let eventsList: any[] = snapshot.docs.map(doc => {
            const data = doc.data();
            
            // Handle n8n inserting Firestore Timestamps instead of strings
            if (data.date) {
              if (typeof data.date.toDate === 'function') {
                data.date = data.date.toDate().toISOString();
              } else if (typeof data.date === 'number') {
                const timestamp = data.date < 10000000000 ? data.date * 1000 : data.date;
                data.date = new Date(timestamp).toISOString();
              } else if (data.date instanceof Date) {
                data.date = data.date.toISOString();
              } else if (typeof data.date === 'string') {
                const parsed = new Date(data.date);
                if (!isNaN(parsed.getTime())) {
                  data.date = parsed.toISOString();
                }
              }
            }
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
              data.createdAt = data.createdAt.toDate().toISOString();
            }

            // Normalizar coordenadas (para n8n u otros formatos)
            if (!data.coordinates) {
              const lat = data.latitud ?? data.latitude ?? data.lat;
              const lng = data.longitud ?? data.longitude ?? data.lng;
              if (lat !== undefined && lng !== undefined) {
                data.coordinates = { lat: Number(lat), lng: Number(lng) };
              }
            }

            // Normalizar arrays
            if (data.vibes && typeof data.vibes === 'string') {
              data.vibes = data.vibes.split(',').map((v: string) => v.trim());
            }
            if (data.tags && typeof data.tags === 'string') {
              data.tags = data.tags.split(',').map((t: string) => t.trim());
            }

            return {
              id: doc.id,
              ...data
            };
          });
          
          if (!includeDrafts) {
            eventsList = eventsList.filter(e => e.status !== 'draft');
          }
          if (!includePrivate) {
            eventsList = eventsList.filter(e => e.type !== 'private' && e.venueId !== 'external_booking');
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
