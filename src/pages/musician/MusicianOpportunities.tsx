import { useState, useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiMapPin, FiCalendar, FiCheck, FiBriefcase, FiChevronLeft, FiChevronRight, FiAlertTriangle, FiX, FiCheckCircle } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useEvents } from '../../hooks/useEvents';
import { useMusicianProfile } from '../../hooks/useMusicianProfile';
import { useMusicianCalendar } from '../../hooks/useMusicianCalendar';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { LoadingScreen } from '../../components/shared/LoadingScreen';
import { useChat } from '../../hooks/useChat';
import { useNavigate } from 'react-router-dom';

export const MusicianOpportunities = () => {
  const { events, loading: eventsLoading } = useEvents(true, true);
  const { profile, loading: profileLoading } = useMusicianProfile();
  const { calendar, updateDayStatus, loading: calendarLoading } = useMusicianCalendar(profile?.id);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const { findOrCreateChat, sendMessage } = useChat();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Estado para la alarma de colisión / doblete
  const [conflictModal, setConflictModal] = useState<{
    isOpen: boolean;
    targetEvent: any;
    existingGig: any | null;
    dateKey: string;
  } | null>(null);
  const [isEnablingDoblete, setIsEnablingDoblete] = useState(false);

  // Helper para normalizar fecha YYYY-MM-DD
  const getDateKey = (date: Date | string) => {
    if (!date) return '';
    if (typeof date === 'string') {
      try {
        return format(parseISO(date), 'yyyy-MM-dd');
      } catch {
        return date.split('T')[0] || '';
      }
    }
    return format(date, 'yyyy-MM-dd');
  };

  // 1. Filtrar ofertas genuinas memoizadas (evita reprocesar en cada frame en móviles)
  const opportunities = useMemo(() => {
    return events
      .filter(e => {
         if (!e.date) return false;

         const status = (e.status || '').toLowerCase().trim();

         // Descartar estados no disponibles para postularse
         if (
           status === 'confirmed' || 
           status === 'musician_accepted' || 
           status === 'pending_musician' ||
           status === 'draft' || 
           status === 'cancelled' || 
           status === 'rejected'
         ) {
           return false;
         }

         // Descartar si el evento ya tiene un músico asignado
         const hasAssignedMusician = Boolean(
           (e.musicianId && String(e.musicianId).trim().length > 0) ||
           (e.musicianName && String(e.musicianName).trim().length > 0 && e.musicianName.trim().toLowerCase() !== 'banda por confirmar')
         );
         if (hasAssignedMusician) {
           return false;
         }

         // Descartar eventos privados o de contratación externa
         if (e.type === 'private' || e.venueId === 'external_booking') {
           return false;
         }

         // Descartar si este músico ya declinó el evento o fue quien lo canceló
         if (profile?.id && Array.isArray(e.declinedBy) && e.declinedBy.includes(profile.id)) {
           return false;
         }
         if (profile?.id && e.cancelledByMusicianId === profile.id) {
           return false;
         }

         // Solo fechas futuras o de hoy en adelante
         const eventDate = parseISO(e.date);
         if (isNaN(eventDate.getTime())) return false;
         const today = new Date();
         today.setHours(0, 0, 0, 0);
         return eventDate >= today;
      })
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  }, [events, profile?.id]);

  // 2. Mapa O(1) de oportunidades por día
  const opportunitiesByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    opportunities.forEach(e => {
      const key = getDateKey(e.date);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [opportunities]);

  // 3. Mapa O(1) de bolos confirmados del músico por día
  const confirmedGigsByDate = useMemo(() => {
    const map: Record<string, any> = {};
    if (!profile?.id) return map;
    events.forEach(e => {
      if (e.musicianId !== profile.id) return;
      const activeStatuses = ['confirmed', 'published', 'pending_musician', 'musician_accepted'];
      if (!activeStatuses.includes(e.status) && e.status) return;
      if (e.status === 'cancelled' || e.status === 'rejected' || e.status === 'musician_cancelled') return;
      if (e.venueId === 'external_booking') return;
      const key = getDateKey(e.date);
      map[key] = e;
    });
    return map;
  }, [events, profile?.id]);

  if (eventsLoading || profileLoading || calendarLoading) return <LoadingScreen />;

  const getExistingGigForDate = (dateStr: string, excludeEventId?: string) => {
    const gig = confirmedGigsByDate[dateStr];
    if (gig && gig.id !== excludeEventId) return gig;
    return null;
  };

  // Ejecución de la postulación
  const executeApplication = async (event: any) => {
    if (!profile?.id) return;
    setApplyingTo(event.id);
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        applicants: arrayUnion(profile.id)
      });
      
      const formattedDate = format(parseISO(event.date), "d 'de' MMMM", { locale: es });
      let template = profile.customApplyMessage;
      
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
      
      if (!event.venueId) {
        throw new Error("Este evento no tiene un Local asignado válido para chatear.");
      }
      
      const chatId = await findOrCreateChat(event.venueId, event.id);
      await sendMessage(chatId, finalMessage);
      
      navigate('/musician/messages', { state: { chatId } });
    } catch (error) {
      console.error(error);
      alert('Hubo un error al postularte.');
    } finally {
      setApplyingTo(null);
    }
  };

  // Manejador al hacer clic en Postularme
  const handleApply = async (event: any) => {
    if (!profile?.id) return;

    const eventDateKey = getDateKey(event.date);
    const existingGig = getExistingGigForDate(eventDateKey, event.id);
    const calStatus = calendar[eventDateKey];
    const allowsDoblete = calStatus === 'booked_partial';
    const isDayBlocked = Boolean(existingGig) || calStatus === 'booked_full' || calStatus === 'unavailable' || calStatus === 'booked';

    // Si ya está bloqueado/comprometido y no ha aceptado doblete, saltar alarma
    if (isDayBlocked && !allowsDoblete) {
      setConflictModal({
        isOpen: true,
        targetEvent: event,
        existingGig: existingGig || null,
        dateKey: eventDateKey
      });
      return;
    }

    await executeApplication(event);
  };

  // Aceptar doblete desde la alarma y continuar automáticamente con la postulación
  const handleAcceptDobleteAndApply = async () => {
    if (!conflictModal?.targetEvent || !conflictModal?.dateKey) return;
    setIsEnablingDoblete(true);
    try {
      await updateDayStatus(conflictModal.dateKey, 'booked_partial');
      const targetEvent = conflictModal.targetEvent;
      setConflictModal(null);
      await executeApplication(targetEvent);
    } catch (err) {
      console.error('Error al activar doblete y postular:', err);
      alert('No se pudo activar el doblete. Inténtalo de nuevo.');
    } finally {
      setIsEnablingDoblete(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getEventsForDay = (day: Date) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    return opportunitiesByDay[dayKey] || [];
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];
  const selectedDateKey = selectedDate ? getDateKey(selectedDate) : '';
  const existingGigForSelectedDate = selectedDateKey ? getExistingGigForDate(selectedDateKey) : null;
  const isSelectedDateDoblete = selectedDateKey ? calendar[selectedDateKey] === 'booked_partial' : false;

  const handleSelectDay = (day: Date) => {
    setSelectedDate(day);
    setIsMobileDrawerOpen(true);
  };

  // Renderiza el aviso si ya tiene un bolo confirmado ese día
  const renderConfirmedGigBanner = () => {
    if (!existingGigForSelectedDate) return null;
    return (
      <div className="mx-3 sm:mx-4 md:mx-6 mt-3 sm:mt-4 p-2.5 sm:p-3.5 bg-amber-950/40 border border-amber-500/40 rounded flex items-start gap-2.5 shrink-0">
        <FiAlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <div className="text-amber-300 font-semibold leading-tight">
            Ya tienes un bolo confirmado este día:
          </div>
          <p className="text-white/90 font-serif text-xs mt-0.5 leading-tight">
            "{existingGigForSelectedDate.title}" en <span className="text-gold">{existingGigForSelectedDate.venueName || 'Local'}</span>
            {existingGigForSelectedDate.time && <span className="text-white/50"> ({existingGigForSelectedDate.time}h)</span>}
          </p>
          <p className="text-white/60 text-[10px] sm:text-[11px] mt-1">
            {isSelectedDateDoblete 
              ? '✓ Doblete activado para admitir más actuaciones.' 
              : 'Requiere Doblete para postularte a otra oferta o anular el previo.'}
          </p>
        </div>
      </div>
    );
  };

  // Renderiza cada tarjeta de oportunidad
  const renderEventCard = (event: any) => {
    const hasApplied = event.applicants?.includes(profile?.id || '');
    const eventDateKey = getDateKey(event.date);
    const existingGigForDay = getExistingGigForDate(eventDateKey, event.id);
    const calStatus = calendar[eventDateKey];
    const allowsDoblete = calStatus === 'booked_partial';
    const isDayBlocked = Boolean(existingGigForDay) || calStatus === 'booked_full' || calStatus === 'unavailable' || calStatus === 'booked';
    const hasConflict = isDayBlocked && !allowsDoblete;
    
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

        {/* Notificaciones contextuales en la tarjeta */}
        {hasConflict && !hasApplied && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] uppercase tracking-wider mb-3 font-semibold">
            <FiAlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Ya tienes bolo este día · Requiere aceptar doblete</span>
          </div>
        )}

        {allowsDoblete && isDayBlocked && !hasApplied && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] uppercase tracking-wider mb-3 font-semibold">
            <FiCheck className="w-3.5 h-3.5 shrink-0 text-blue-400" />
            <span>Doblete permitido para este día</span>
          </div>
        )}

        <div className="mt-auto flex gap-2 pt-3 border-t border-white/5">
          <button 
            onClick={() => handleApply(event)}
            disabled={hasApplied || applyingTo === event.id}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] uppercase tracking-widest font-bold transition-colors ${
              hasApplied 
                ? 'bg-green-900/30 text-green-500 border border-green-500/50 cursor-not-allowed' 
                : hasConflict
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500 hover:text-black'
                : 'bg-gold text-black hover:bg-white'
            }`}
          >
            {applyingTo === event.id ? (
              '...'
            ) : hasApplied ? (
              <><FiCheck className="w-3 h-3" /> Postulado</>
            ) : hasConflict ? (
              <><FiAlertTriangle className="w-3.5 h-3.5" /> Postularme al Bolo</>
            ) : (
              <><FaWhatsapp className="w-4 h-4" /> Postularme al Bolo</>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 md:gap-8 max-w-7xl mx-auto xl:h-[calc(100vh-8rem)] w-full relative pb-28 xl:pb-0">
      
      {/* Calendar Section */}
      <div className="flex-1 flex flex-col bg-slate-950 border border-slate-800 p-4 md:p-6 shadow-2xl xl:overflow-hidden w-full shrink-0">
        
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
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayEvents = opportunitiesByDay[dayKey] || [];
            const hasOpportunities = dayEvents.length > 0;
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            const cellBg = isSelected ? 'bg-slate-800' : 'bg-slate-900';
            const dateTextColor = isSelected ? 'text-gold font-bold' : (isToday ? 'text-blue-400 font-bold' : 'text-white/80');
            
            return (
              <div 
                key={day.toISOString()}
                onClick={() => handleSelectDay(day)}
                className={`${cellBg} border border-white/5 aspect-square p-1 md:p-2 relative cursor-pointer hover:bg-white/5 transition-colors flex flex-col items-center justify-start gap-1 overflow-hidden ${!isCurrentMonth ? 'opacity-20' : ''} ${isToday ? 'ring-2 ring-blue-500/50 ring-inset' : ''} ${isSelected ? 'ring-1 md:ring-2 ring-gold ring-inset z-10' : ''}`}
              >
                <span className={`text-xs md:text-sm font-serif ${dateTextColor}`}>
                  {format(day, 'd')}
                </span>
                
                {hasOpportunities && (
                  <div className="w-full mt-auto mb-1 flex justify-center">
                    <div 
                      className="w-2 h-2 rounded-full bg-gold animate-pulse shadow-[0_0_8px_rgba(197,160,89,0.8)]" 
                      title="Locales buscando músicos"
                    />
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

        {/* Botón flotante móvil para reabrir ofertas del día seleccionado si se cerró el panel */}
        {selectedDate && !isMobileDrawerOpen && (
          <div className="xl:hidden fixed bottom-20 inset-x-4 z-30 flex justify-center pointer-events-none">
            <button 
              onClick={() => setIsMobileDrawerOpen(true)}
              className="pointer-events-auto bg-gold text-black font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-full shadow-[0_4px_25px_rgba(197,160,89,0.5)] flex items-center gap-2 active:scale-95 transition-transform border border-gold/40"
            >
              <FiBriefcase className="w-4 h-4" /> Ver Ofertas ({selectedDayEvents.length}) · {format(selectedDate, "d 'de' MMM", { locale: es })}
            </button>
          </div>
        )}
      </div>

      {/* Results Section Desktop (visible solo en pantallas grandes xl+) */}
      <div id="opportunities-details" className="hidden xl:flex w-[450px] flex-col bg-slate-950 border border-slate-800 shrink-0 scroll-mt-20">
        {!selectedDate ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/40 min-h-[300px]">
            <FiCalendar className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">Selecciona un día en el calendario para ver qué locales buscan músicos en esa fecha.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col xl:overflow-hidden">
            <div className="p-4 md:p-6 border-b border-white/10 bg-white/5 shrink-0">
              <h2 className="text-xl md:text-2xl font-serif text-white">
                {format(selectedDate, "d 'de' MMMM", { locale: es })}
              </h2>
              <p className="text-gold text-[10px] uppercase tracking-widest mt-1 font-bold">
                {selectedDayEvents.length} Oferta{selectedDayEvents.length !== 1 ? 's' : ''} encontrada{selectedDayEvents.length !== 1 ? 's' : ''}
              </p>
            </div>

            {renderConfirmedGigBanner()}

            <div className="p-3 sm:p-4 md:p-6 flex flex-col gap-3 sm:gap-4 xl:flex-1 xl:overflow-y-auto pb-6">
              {selectedDayEvents.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-white/30 text-xs italic">No hay ningún local buscando músicos este día.</p>
                </div>
              ) : (
                selectedDayEvents.map(event => renderEventCard(event))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet Drawer para Móviles (< xl) */}
      {isMobileDrawerOpen && selectedDate && (
        <>
          {/* Backdrop con desenfoque suave */}
          <div 
            onClick={() => setIsMobileDrawerOpen(false)} 
            className="xl:hidden fixed inset-0 z-40 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" 
          />

          {/* Drawer contenedor deslizable */}
          <div className="xl:hidden fixed inset-x-0 bottom-0 z-50 bg-slate-950 border-t border-gold/40 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.9)] max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-250 overscroll-contain">
            
            {/* Header con Tirador táctil y botón cerrar */}
            <div className="p-4 border-b border-white/10 bg-white/5 shrink-0">
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-3" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-serif text-white leading-tight capitalize">
                    {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                  </h2>
                  <p className="text-gold text-[10px] uppercase tracking-widest mt-1 font-bold">
                    {selectedDayEvents.length} Oferta{selectedDayEvents.length !== 1 ? 's' : ''} disponible{selectedDayEvents.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button 
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-2 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/10 active:scale-95 transition-transform"
                  title="Cerrar y volver al calendario"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Aviso de bolo previo si aplica */}
            {renderConfirmedGigBanner()}

            {/* Lista con scroll nativo fluido 100% libre de bloqueos */}
            <div 
              className="flex-1 overflow-y-auto overscroll-contain p-4 flex flex-col gap-3 pb-8"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {selectedDayEvents.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-white/40 text-xs italic">No hay ningún local buscando músicos este día.</p>
                </div>
              ) : (
                selectedDayEvents.map(event => renderEventCard(event))
              )}

              <button 
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-full py-3.5 mt-2 border border-white/20 text-white/80 hover:text-white text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 bg-white/5 active:bg-white/10 transition-colors rounded-sm"
              >
                <FiChevronLeft className="w-4 h-4 rotate-90" /> Volver al Calendario
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal de Alarma por Colisión de Fechas / Doblete */}
      {conflictModal?.isOpen && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.2)] max-w-lg w-full p-6 md:p-8 flex flex-col gap-5 relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Botón cerrar */}
            <button 
              onClick={() => setConflictModal(null)}
              className="absolute top-4 right-4 text-white/40 hover:text-white p-1 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>

            {/* Cabecera con icono de alarma */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                <FiAlertTriangle className="w-7 h-7" />
              </div>
              <h2 className="text-xl md:text-2xl font-serif text-white font-bold leading-tight">
                ¡Atención: Fecha ya bloqueada!
              </h2>
              <p className="text-gold text-xs uppercase tracking-widest mt-1 font-semibold">
                {conflictModal.dateKey ? format(parseISO(conflictModal.dateKey), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : ''}
              </p>
            </div>

            {/* Comparativa de bolos */}
            <div className="flex flex-col gap-3 bg-white/5 border border-white/10 p-4">
              {conflictModal.existingGig ? (
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-amber-400 font-bold block mb-1">
                    ✓ Bolo que ya tienes confirmado:
                  </span>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-serif text-white font-semibold">
                        {conflictModal.existingGig.title}
                      </p>
                      <p className="text-xs text-white/70 flex items-center gap-1.5 mt-0.5">
                        <FiMapPin className="text-gold w-3 h-3 shrink-0" />
                        <span>{conflictModal.existingGig.venueName || 'Local'}</span>
                      </p>
                    </div>
                    <span className="text-xs text-white/80 bg-white/10 px-2 py-0.5 font-bold shrink-0">
                      {conflictModal.existingGig.time || (conflictModal.existingGig.date ? format(parseISO(conflictModal.existingGig.date), "HH:mm") : '')}h
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-red-400 font-bold block mb-1">
                    Estado de tu agenda:
                  </span>
                  <p className="text-xs text-white/80">
                    Tienes esta fecha marcada como <strong className="text-red-400">No Disponible</strong> en tu calendario.
                  </p>
                </div>
              )}

              <div className="h-px bg-white/10 w-full my-1"></div>

              <div>
                <span className="text-[9px] uppercase tracking-widest text-white/50 font-bold block mb-1">
                  Nuevo bolo al que intentas postularte:
                </span>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-serif text-white font-semibold">
                      {conflictModal.targetEvent.title}
                    </p>
                    <p className="text-xs text-white/70 flex items-center gap-1.5 mt-0.5">
                      <FiMapPin className="text-gold w-3 h-3 shrink-0" />
                      <span>{conflictModal.targetEvent.venueName || 'Local'}</span>
                    </p>
                  </div>
                  <span className="text-xs text-white/80 bg-white/10 px-2 py-0.5 font-bold shrink-0">
                    {conflictModal.targetEvent.time || (conflictModal.targetEvent.date ? format(parseISO(conflictModal.targetEvent.date), "HH:mm") : '')}h
                  </span>
                </div>
              </div>
            </div>

            {/* Explicación normativa */}
            <div className="text-xs text-white/80 text-center leading-relaxed space-y-1 px-1">
              <p>
                Para evitar solapamientos, <strong className="text-white">no puedes aceptar un segundo evento</strong> a no ser que actives la opción de <strong className="text-gold">Doblete</strong> (dos actuaciones el mismo día) o canceles tu actuación previa.
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                disabled={isEnablingDoblete}
                onClick={handleAcceptDobleteAndApply}
                className="w-full py-3 px-4 bg-gold text-black font-bold uppercase tracking-widest text-xs hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isEnablingDoblete ? (
                  'Guardando y enviando postulación...'
                ) : (
                  <>
                    <FiCheckCircle className="w-4 h-4" />
                    Aceptar Doblete y Postularme
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setConflictModal(null);
                  navigate('/musician/calendar');
                }}
                className="w-full py-2.5 px-4 bg-white/5 border border-white/15 text-white/90 font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <FiCalendar className="w-3.5 h-3.5 text-gold" />
                Ver / Cancelar en Mi Calendario
              </button>

              <button
                onClick={() => setConflictModal(null)}
                className="w-full py-2 text-white/40 hover:text-white text-[10px] uppercase tracking-widest transition-colors text-center"
              >
                Volver (No postularme)
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

