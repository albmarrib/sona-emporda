import { useState } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiMapPin, FiCalendar, FiCheck, FiBriefcase, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
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

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  if (loading) return <LoadingScreen />;

  // Filter for events that are NOT confirmed and have NOT been declined by the musician
  const opportunities = events
    .filter(e => {
       if (e.status === 'confirmed' || e.status === 'draft' || e.status === 'cancelled' || e.declinedBy?.includes(profile?.id)) return false;
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
      
      // Asegurar que el mensaje siempre es claro y específico si no hay template o si hay datos vacíos en el perfil
      const myName = profile.stageName || 'un músico';
      const venueTarget = event.venueName || 'Equipo del Local';
      const eventTitle = event.title || 'Evento';
      
      let finalMessage = `¡Hola ${venueTarget}! Somos ${myName} y nos postulamos para tocar en el evento "${eventTitle}" del ${formattedDate}.\n\n`;
      
      if (template) {
        const cleanTemplate = template.replace('[Músico]', myName).replace('[Local]', venueTarget).replace('[Evento]', eventTitle);
        finalMessage += `Mensaje: "${cleanTemplate}"`;
      } else {
        finalMessage += `¡Nos encantaría poder participar y que contéis con nosotros!`;
      }
      
      const chatId = await findOrCreateChat(event.venueId || 'venue', event.id);
      await sendMessage(chatId, finalMessage);
      
      navigate('/musician/messages', { state: { chatId } });
    } catch (error) {
      console.error(error);
      alert('Hubo un error al postularte.');
    } finally {
      setApplyingTo(null);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getEventsForDay = (day: Date) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    return opportunities.filter(e => format(parseISO(e.date), 'yyyy-MM-dd') === dayKey);
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="flex flex-col xl:flex-row gap-6 md:gap-8 max-w-7xl mx-auto xl:h-[calc(100vh-8rem)] w-full">
      
      {/* Calendar Section */}
      <div className="flex-1 flex flex-col bg-slate-950 border border-slate-800 p-4 md:p-6 shadow-2xl overflow-hidden w-full">
        
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3 gap-2">
          <h1 className="text-xl md:text-2xl font-serif text-white flex items-center gap-2 truncate">
            <FiBriefcase className="text-gold w-5 h-5 shrink-0" /> <span className="uppercase tracking-widest text-base md:text-xl">Ofertas</span>
          </h1>
          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={prevMonth} className="p-1.5 md:p-2 border border-white/10 hover:border-gold hover:text-gold transition-colors text-white/70">
              <FiChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <div className="text-center min-w-[80px] md:min-w-[100px]">
              <p className="text-sm md:text-base font-serif text-white capitalize truncate leading-none">
                {format(currentDate, 'MMMM', { locale: es })} <span className="text-white/50 text-xs ml-1">{format(currentDate, 'yyyy')}</span>
              </p>
            </div>
            <button onClick={nextMonth} className="p-1.5 md:p-2 border border-white/10 hover:border-gold hover:text-gold transition-colors text-white/70">
              <FiChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-px mb-2 w-full">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="text-center text-gold text-[9px] md:text-[10px] uppercase tracking-widest font-bold pb-2 border-b border-white/10 truncate">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-px bg-slate-800 w-full mb-4 md:mb-0">
          {Array.from({ length: getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1 }).map((_, index) => (
            <div key={`empty-${index}`} className="bg-slate-900/50 aspect-square p-1 md:p-2" />
          ))}
          {daysInMonth.map(day => {
            const dayEvents = getEventsForDay(day);
            const hasOpportunities = dayEvents.length > 0;
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            const cellBg = isSelected ? 'bg-slate-800' : 'bg-slate-900';
            const dateTextColor = isSelected ? 'text-gold font-bold' : (isToday ? 'text-blue-400 font-bold' : 'text-white/80');
            
            return (
              <div 
                key={day.toISOString()}
                onClick={() => {
                  setSelectedDate(day);
                  if (window.innerWidth < 1280) {
                    setTimeout(() => {
                      document.getElementById('opportunities-details')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }
                }}
                className={`${cellBg} border border-white/5 aspect-square p-1 md:p-2 relative cursor-pointer hover:bg-white/5 transition-colors flex flex-col items-center justify-start gap-1 overflow-hidden ${!isCurrentMonth ? 'opacity-20' : ''} ${isToday ? 'ring-2 ring-blue-500/50 ring-inset' : ''} ${isSelected ? 'ring-1 md:ring-2 ring-gold ring-inset z-10' : ''}`}
              >
                <span className={`text-xs md:text-sm font-serif ${dateTextColor}`}>
                  {format(day, 'd')}
                </span>
                
                {hasOpportunities && (
                  <div className="w-full mt-auto mb-1 flex justify-center">
                    <div className="w-2 h-2 rounded-full bg-gold animate-pulse shadow-[0_0_8px_rgba(197,160,89,0.8)]"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-auto pt-4 flex flex-wrap gap-4 text-[9px] uppercase tracking-widest text-white/50 bg-white/5 p-4 border border-white/10 w-full justify-center md:justify-start">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-gold animate-pulse shadow-[0_0_8px_rgba(197,160,89,0.8)]"></div>
             Días con locales buscando músicos
           </div>
        </div>
      </div>

      {/* Results Section */}
      <div id="opportunities-details" className="w-full xl:w-[450px] flex flex-col bg-slate-950 border border-slate-800 shrink-0 scroll-mt-20">
        {!selectedDate ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/40 min-h-[300px]">
            <FiCalendar className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">Selecciona un día en el calendario para ver qué locales buscan músicos en esa fecha.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 md:p-6 border-b border-white/10 bg-white/5 shrink-0">
              <h2 className="text-xl md:text-2xl font-serif text-white">
                {format(selectedDate, "d 'de' MMMM", { locale: es })}
              </h2>
              <p className="text-gold text-[10px] uppercase tracking-widest mt-1 font-bold">
                {selectedDayEvents.length} Oferta{selectedDayEvents.length !== 1 ? 's' : ''} encontrada{selectedDayEvents.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
              {selectedDayEvents.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-white/30 text-xs italic">No hay ningún local buscando músicos este día.</p>
                </div>
              ) : (
                selectedDayEvents.map(event => {
                  const hasApplied = event.applicants?.includes(profile?.id || '');
                  
                  return (
                    <div key={event.id} className="bg-zinc-950 border border-white/10 p-4 flex flex-col hover:border-white/20 transition-colors group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="w-full">
                          <div className="flex justify-between items-center w-full mb-1">
                            <span className="text-gold text-[8px] uppercase tracking-widest border border-gold/30 bg-gold/10 px-1.5 py-0.5 inline-block">
                              Buscando Grupo
                            </span>
                            <span className="text-white/60 text-[10px] uppercase tracking-widest flex items-center gap-1 font-bold">
                              {format(parseISO(event.date), "HH:mm")}
                            </span>
                          </div>
                          <h3 className="text-lg font-serif text-white leading-tight mb-1 group-hover:text-gold transition-colors">{event.title}</h3>
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

                      <div className="mt-auto flex gap-2 pt-3 border-t border-white/5">
                        <button 
                          onClick={() => handleApply(event)}
                          disabled={hasApplied || applyingTo === event.id}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] uppercase tracking-widest font-bold transition-colors ${
                            hasApplied 
                              ? 'bg-green-900/30 text-green-500 border border-green-500/50 cursor-not-allowed' 
                              : 'bg-gold text-black hover:bg-white'
                          }`}
                        >
                          {applyingTo === event.id ? '...' : hasApplied ? <><FiCheck className="w-3 h-3" /> Postulado</> : <><FaWhatsapp className="w-4 h-4" /> Postularme al Bolo</>}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
