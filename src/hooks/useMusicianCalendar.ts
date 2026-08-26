import { useState, useEffect } from 'react';
import { type MusicianCalendar, type DayStatus } from '../types';
import { db } from '../firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEvents } from './useEvents';
import { useAuth } from '../contexts/AuthContext';

export const useMusicianCalendar = (musicianId?: string) => {
  const [calendar, setCalendar] = useState<MusicianCalendar>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  
  const { events, loading: eventsLoading } = useEvents(true);

  useEffect(() => {
    if (eventsLoading) return;

    const fetchCalendar = async () => {
      setLoading(true);
      try {
        const myMusicianId = musicianId || currentUser?.uid;
        if (!myMusicianId) return;
        let baseCalendar: MusicianCalendar = {};
        
        // Fetch from Firestore
        const docRef = doc(db, 'users', myMusicianId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().calendar) {
          baseCalendar = docSnap.data().calendar;
        }
        
        // Inyectamos dinámicamente todos sus eventos confirmados como 'booked'
        const myConfirmedEvents = events.filter(e => 
          e.musicianId === myMusicianId && 
          (e.status === 'confirmed' || (e.status === 'published' && e.musicianId) || !e.venueId)
        );
        
        myConfirmedEvents.forEach(event => {
          // Extraemos YYYY-MM-DD de la fecha ISO
          const dateKey = event.date.split('T')[0];
          // Por defecto al haber evento confirmado es rojo (booked_full), salvo que el músico lo abra
          if (baseCalendar[dateKey] !== 'booked_partial') {
            baseCalendar[dateKey] = 'booked_full';
          }
        });

        setCalendar(baseCalendar);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCalendar();
  }, [musicianId, events, eventsLoading]);

  const updateDayStatus = async (dateIso: string, status: DayStatus | null) => {
    // Optimistic UI update (actualizamos la UI al instante, luego en Firebase en background)
    const newCalendar = { ...calendar };
    
    if (status === null) {
      delete newCalendar[dateIso];
    } else {
      newCalendar[dateIso] = status;
    }
    
    setCalendar(newCalendar);

    // Escribir en Firestore
    try {
      const myMusicianId = musicianId || currentUser?.uid;
      if (!myMusicianId) return;
      await updateDoc(doc(db, 'users', myMusicianId), {
        calendar: newCalendar
      });
    } catch (e) {
      console.error(e);
    }
  };

  return { calendar, loading, error, updateDayStatus };
};
