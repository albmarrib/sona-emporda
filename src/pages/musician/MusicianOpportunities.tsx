import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiMapPin, FiCalendar, FiCheck, FiMessageCircle, FiBriefcase } from 'react-icons/fi';
import { useEvents } from '../../hooks/useEvents';
import { useMusicianProfile } from '../../hooks/useMusicianProfile';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { LoadingScreen } from '../../components/shared/LoadingScreen';

export const MusicianOpportunities = () => {
  const { events, loading } = useEvents(true);
  const { profile } = useMusicianProfile();
  const [applyingTo, setApplyingTo] = useState<string | null>(null);

  if (loading) return <LoadingScreen />;

  // Filter for events that are NOT confirmed and have NOT been declined by the musician
  const opportunities = events
    .filter(e => e.status !== 'confirmed' && e.status !== 'draft' && !e.declinedBy?.includes(profile?.id))
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  const handleApply = async (eventId: string) => {
    if (!profile?.id) return;
    setApplyingTo(eventId);
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        applicants: arrayUnion(profile.id)
      });
      alert('¡Te has postulado con éxito!');
    } catch (error) {
      console.error(error);
      alert('Hubo un error al postularte.');
    } finally {
      setApplyingTo(null);
    }
  };

  const openWhatsApp = (venueName: string, eventTitle: string, date: string) => {
    const formattedDate = format(parseISO(date), "d 'de' MMMM", { locale: es });
    const text = encodeURIComponent(`Hola ${venueName}, somos ${profile?.stageName || 'un grupo'}. Hemos visto que buscáis músicos para el evento "${eventTitle}" del ${formattedDate}. Nos gustaría postularnos.`);
    // Since we don't have a phone number in the mock event, we'll use a dummy one
    const dummyPhone = "34600000000";
    window.open(`https://wa.me/${dummyPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif text-white mb-2 flex items-center gap-3">
          <FiBriefcase className="text-gold" />
          Oportunidades de Bolos
        </h1>
        <p className="text-white/50 text-[10px] uppercase tracking-widest">
          Eventos pendientes de asignar músico. Postúlate para que el local te contacte.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {opportunities.length === 0 ? (
          <div className="col-span-full py-12 text-center border border-white/10 bg-white/5">
            <p className="text-white/50 uppercase tracking-widest text-xs">No hay oportunidades disponibles en este momento.</p>
          </div>
        ) : (
          opportunities.map(event => {
            const hasApplied = event.applicants?.includes(profile?.id || '');
            
            return (
              <div key={event.id} className="bg-black border border-white/10 p-4 flex flex-col hover:border-white/20 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-full">
                    <div className="flex justify-between items-center w-full mb-1">
                      <span className="text-gold text-[8px] uppercase tracking-widest border border-gold/30 bg-gold/10 px-1.5 py-0.5 inline-block">
                        Buscando Grupo
                      </span>
                      <span className="text-white text-[10px] uppercase tracking-widest flex items-center gap-1 font-bold">
                        <FiCalendar className="w-3 h-3 text-gold" />
                        {format(parseISO(event.date), "d MMM", { locale: es })} • {format(parseISO(event.date), "HH:mm")}
                      </span>
                    </div>
                    <h3 className="text-lg font-serif text-white leading-tight mb-1">{event.title}</h3>
                    <p className="text-white/90 text-[11px] flex items-center gap-1">
                      <FiMapPin className="text-gold w-3 h-3 shrink-0" />
                      <span className="truncate">{event.venueName} — {event.location || event.venueLocation}</span>
                    </p>
                  </div>
                </div>

                {event.vibes && event.vibes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {event.vibes.map((vibe: string) => (
                      <span key={vibe} className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 bg-white/5 border border-white/10 text-white/60">
                        {vibe}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex gap-2">
                  <button 
                    onClick={() => handleApply(event.id)}
                    disabled={hasApplied || applyingTo === event.id}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 text-[9px] uppercase tracking-widest font-bold transition-colors ${
                      hasApplied 
                        ? 'bg-green-900/30 text-green-500 border border-green-500/50 cursor-not-allowed' 
                        : 'bg-gold text-black hover:bg-white'
                    }`}
                  >
                    {applyingTo === event.id ? '...' : hasApplied ? <><FiCheck className="w-3 h-3" /> Listo</> : 'Postularme'}
                  </button>
                  <button 
                    onClick={() => openWhatsApp(event.venueName, event.title, event.date)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 border border-white/20 text-white hover:bg-white/10 transition-colors text-[9px] uppercase tracking-widest"
                  >
                    <FiMessageCircle className="w-3 h-3" />
                    WhatsApp
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
