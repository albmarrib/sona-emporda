import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiMapPin, FiCalendar, FiCheck, FiBriefcase } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useEvents } from '../../hooks/useEvents';
import { useMusicianProfile } from '../../hooks/useMusicianProfile';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { LoadingScreen } from '../../components/shared/LoadingScreen';
import { useChat } from '../../hooks/useChat';
import { useNavigate } from 'react-router-dom';

export const MusicianOpportunities = () => {
  const { events, loading } = useEvents(true);
  const { profile } = useMusicianProfile();
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const { findOrCreateChat, sendMessage } = useChat();
  const navigate = useNavigate();

  if (loading) return <LoadingScreen />;

  // Filter for events that are NOT confirmed and have NOT been declined by the musician
  const opportunities = events
    .filter(e => {
       if (e.status === 'confirmed' || e.status === 'draft' || e.declinedBy?.includes(profile?.id)) return false;
       const eventDate = parseISO(e.date);
       const today = new Date();
       today.setHours(0, 0, 0, 0);
       return eventDate >= today;
    })
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  const handleApply = async (event: any) => {
    if (!profile?.id) return;
    setApplyingTo(event.id);
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        applicants: arrayUnion(profile.id)
      });
      
      const formattedDate = format(parseISO(event.date), "d 'de' MMMM", { locale: es });
      let template = profile.customApplyMessage;
      if (template) {
        template = template.replace('[Músico]', profile.stageName).replace('[Local]', event.venueName).replace('[Evento]', event.title);
      } else {
        template = `Hola ${event.venueName}, somos ${profile.stageName}. Hemos visto que buscáis músicos para el evento "${event.title}" del ${formattedDate}. Nos gustaría postularnos para tocar allí.`;
      }
      
      const chatId = await findOrCreateChat(event.venueId || 'venue', event.id);
      await sendMessage(chatId, template);
      
      navigate('/musician/messages', { state: { chatId } });
    } catch (error) {
      console.error(error);
      alert('Hubo un error al postularte.');
    } finally {
      setApplyingTo(null);
    }
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
                    onClick={() => handleApply(event)}
                    disabled={hasApplied || applyingTo === event.id}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors ${
                      hasApplied 
                        ? 'bg-green-900/30 text-green-500 border border-green-500/50 cursor-not-allowed' 
                        : 'bg-gold text-black hover:bg-white'
                    }`}
                  >
                    {applyingTo === event.id ? '...' : hasApplied ? <><FiCheck className="w-3 h-3" /> Postulado</> : <><FaWhatsapp className="w-4 h-4" /> Postularme y Abrir Chat</>}
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
