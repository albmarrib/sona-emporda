import { useState, useEffect } from 'react';
import { type MusicianCalendar, type DayStatus } from '../types';
import { db } from '../firebase/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useEvents } from './useEvents';
import { useAuth } from '../contexts/AuthContext';

export const useMusicianCalendar = (musicianId?: string) => {
  const [calendar, setCalendar] = useState<MusicianCalendar>({});
  const [baseCalendar, setBaseCalendar] = useState<MusicianCalendar>({});
  const [baseLoaded, setBaseLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { currentUser } = useAuth();
  const { events, loading: eventsLoading } = useEvents(true, true);

  // 1. Fetch User Calendar from Firestore in Realtime with onSnapshot
  useEffect(() => {
    const myMusicianId = musicianId || currentUser?.uid;
    if (!myMusicianId) {
      setBaseCalendar({});
      setBaseLoaded(true);
      return;
    }

    const docRef = doc(db, 'users', myMusicianId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().calendar) {
        setBaseCalendar(docSnap.data().calendar);
      } else {
        setBaseCalendar({});
      }
      setBaseLoaded(true);
    }, (err: any) => {
      setError(err.message);
      setBaseLoaded(true);
    });

    return () => unsubscribe();
  }, [musicianId, currentUser?.uid]);

  // 2. Combine baseCalendar with Confirmed Events
  useEffect(() => {
    if (!baseLoaded || eventsLoading) return;

    const myMusicianId = musicianId || currentUser?.uid;
    const newCalendar = { ...baseCalendar };

    if (myMusicianId) {
      // Un evento solo bloquea el día si está CONFIRMADO o publicado oficialmente
      const myConfirmedEvents = events.filter(e => 
        e.musicianId === myMusicianId && 
        (e.status === 'confirmed' || (e.status === 'published' && e.venueId !== 'external_booking'))
      );
      
      myConfirmedEvents.forEach(event => {
        if (!event.date) return;
        const dateKey = event.date.split('T')[0];
        if (newCalendar[dateKey] !== 'booked_partial') {
          newCalendar[dateKey] = 'booked_full';
        }
      });
    }

    setCalendar(newCalendar);
    setLoading(false);
  }, [baseCalendar, baseLoaded, events, eventsLoading, musicianId, currentUser?.uid]);

  const updateDayStatus = async (dateIso: string, status: DayStatus | null) => {
    const myMusicianId = musicianId || currentUser?.uid;
    if (!myMusicianId) return;

    const newBase = { ...baseCalendar };
    
    if (status === null) {
      delete newBase[dateIso];
    } else {
      newBase[dateIso] = status;
    }
    
    // Update local base immediately
    setBaseCalendar(newBase);

    // Escribir en Firestore
    try {
      await updateDoc(doc(db, 'users', myMusicianId), {
        calendar: newBase
      });
    } catch (e) {
      console.error('Error updating calendar day status:', e);
    }
  };

  return { calendar, loading, error, updateDayStatus };
};
