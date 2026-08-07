import { useState, useEffect } from 'react';
import { type MusicianCalendar, type DayStatus, mockMusicianCalendar } from '../data/mockMusicianData';
import { mockEvents } from '../data/mockEvents';

export const useMusicianCalendar = (musicianId?: string) => {
  const [calendar, setCalendar] = useState<MusicianCalendar>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalendar = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Empezamos con el calendario base del músico
        const baseCalendar = { ...mockMusicianCalendar };
        
        // Inyectamos dinámicamente todos sus eventos confirmados como 'booked'
        // Similamos ser "musician-123" por defecto
        const myMusicianId = musicianId || "musician-123";
        const myEvents = mockEvents.filter(e => e.musicianId === myMusicianId);
        
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
  }, [musicianId]);

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

  return { calendar, loading, error, updateDayStatus };
};
