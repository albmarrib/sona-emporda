import { useState, useEffect } from 'react';
import { type MusicianCalendar, type DayStatus } from '../types';
import { db } from '../firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEvents } from './useEvents';
import { useAuth } from '../contexts/AuthContext';

export const useMusicianCalendar = (musicianId?: string) => {
  const [calendar, setCalendar] = useState<MusicianCalendar>({});
  const [baseCalendar, setBaseCalendar] = useState<MusicianCalendar>({});
  const [baseLoaded, setBaseLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { currentUser } = useAuth();
  const { events, loading: eventsLoading } = useEvents(true);

  // 1. Fetch User Calendar from Firestore ONCE
  useEffect(() => {
    const myMusicianId = musicianId || currentUser?.uid;
    if (!myMusicianId) {
      setBaseLoaded(true);
      return;
    }

    const fetchBase = async () => {
      try {
        const docRef = doc(db, 'users', myMusicianId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().calendar) {
          setBaseCalendar(docSnap.data().calendar);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setBaseLoaded(true);
      }
    };
    fetchBase();
  }, [musicianId, currentUser?.uid]);

  // 2. Combine baseCalendar with Events
  useEffect(() => {
    if (!baseLoaded || eventsLoading) return;

    const myMusicianId = musicianId || currentUser?.uid;
    const newCalendar = { ...baseCalendar };

    if (myMusicianId) {
      const myConfirmedEvents = events.filter(e => 
        e.musicianId === myMusicianId && 
        (e.status === 'confirmed' || (e.status === 'published' && e.musicianId) || !e.venueId)
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
    const newBase = { ...baseCalendar };
    
    if (status === null) {
      delete newBase[dateIso];
    } else {
      newBase[dateIso] = status;
    }
    
    // Update local base (will instantly trigger effect to update 'calendar')
    setBaseCalendar(newBase);

    // Escribir en Firestore
    try {
      const myMusicianId = musicianId || currentUser?.uid;
      if (!myMusicianId) return;
      await updateDoc(doc(db, 'users', myMusicianId), {
        calendar: newBase
      });
    } catch (e) {
      console.error(e);
    }
  };

  return { calendar, loading, error, updateDayStatus };
};
