import { useState, useEffect } from 'react';
import { type MusicianCalendar, type DayStatus, mockMusicianCalendar } from '../data/mockMusicianData';
import { useEvents } from './useEvents';

export const useMusicianCalendar = (musicianId?: string) => {
  const [calendar, setCalendar] = useState<MusicianCalendar>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { events, loading: eventsLoading } = useEvents(true);

  useEffect(() => {
    if (eventsLoading) return;

    const fetchCalendar = async () => {
      setLoading(true);
      try {
        // Empezamos con el calendario base del músico
        const baseCalendar = { ...mockMusicianCalendar };
        
        // Inyectamos dinámicamente todos sus eventos confirmados como 'booked'
        const myMusicianId = musicianId || "musician-123";
        const myEvents = events.filter(e => e.musicianId === myMusicianId);
        
        myEvents.forEach(event => {
          // Extraemos YYYY-MM-DD de la fecha ISO
          const dateKey = event.date.split('T')[0];
          baseCalendar[dateKey] = 'booked';
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

    // Simular escritura en Firestore
    await new Promise(resolve => setTimeout(resolve, 300));
  };

  const markAllAvailable = async (datesIso: string[]) => {
    const newCalendar = { ...calendar };
    let hasChanges = false;
    
    datesIso.forEach(dateIso => {
      // Solo sobreescribir si NO está booked
      if (newCalendar[dateIso] !== 'booked') {
        newCalendar[dateIso] = 'available';
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setCalendar(newCalendar);
      // Simular escritura batch en Firestore
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return { calendar, loading, error, updateDayStatus, markAllAvailable };
};
