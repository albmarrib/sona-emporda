import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiSend, FiChevronLeft, FiChevronRight, FiInfo, FiX, FiMessageSquare, FiCheckCircle, FiAlertTriangle, FiUsers } from 'react-icons/fi';
import { useMusicianCalendar } from '../../hooks/useMusicianCalendar';
import type { DayStatus } from '../../types';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../../hooks/useEvents';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../hooks/useChat';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { EventViewModal } from '../../components/shared/EventViewModal';

import { useSosAlerts } from '../../hooks/useSosAlerts';

export const AvailabilityCalendar = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const { events } = useEvents(false, true);
  const { calendar, loading, updateDayStatus } = useMusicianCalendar();
  const { activeSosCount, activeCollabCount } = useSosAlerts();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedManageDate, setSelectedManageDate] = useState<string | null>(null);
  const [eventToView, setEventToView] = useState<any | null>(null);
  const { findOrCreateChat, sendMessage } = useChat();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = monthStart;
  const endDate = monthEnd;
  const dateFormat = "yyyy-MM-dd";

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const toggleDayStatus = async (date: Date) => {
    const dateKey = format(date, dateFormat);
    const currentStatus = calendar[dateKey];
    
    // Si ya hay un bolo confirmado ('booked_full' o 'booked_partial')
    if (currentStatus === 'booked_full' || currentStatus === 'booked_partial') {
      setSelectedManageDate(dateKey);
      return;
    }

    // Toggle normal: Libre (null) <-> No Disponible (unavailable)
    let newStatus: DayStatus | null = 'unavailable';
    if (currentStatus === 'unavailable') {
      newStatus = null;
    } else {
      if (!window.confirm(`¿Estás seguro de que quieres marcar el día ${format(date, 'd', { locale: es })} de ${format(date, 'MMMM', { locale: es })} como No Disponible?`)) return;
    }

    await updateDayStatus(dateKey, newStatus);
  };

  const getStatusColor = (status?: DayStatus) => {
    switch (status) {
      case 'unavailable': return 'bg-red-800/60 text-red-300 border-red-400 shadow-[inset_0_0_10px_rgba(248,113,113,0.2)]';
      case 'booked_full': return 'bg-red-800/80 text-white border-red-500 shadow-[inset_0_0_15px_rgba(248,113,113,0.4)]';
      case 'booked_partial': return 'bg-[linear-gradient(135deg,rgba(153,27,27,0.8)_50%,rgba(255,255,255,0.05)_50%)] text-white border-white/40';
      default: return 'bg-white/5 text-white/70 border-white/20 hover:bg-white/10 hover:border-white/40'; // Default is available
    }
  };

  if (loading) {
    return <div className="text-gold animate-pulse text-xs uppercase tracking-widest font-bold">Cargando calendario...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl overflow-hidden w-full">
      
      <div className="flex items-start md:items-center justify-between border-b border-white/10 pb-3 gap-2">
        <button onClick={prevMonth} className="p-1.5 md:p-2 text-white hover:text-gold transition-colors border border-white/10 hover:border-gold mt-1 md:mt-0">
          <FiChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        
        <div className="flex flex-col items-center flex-1">
          <h1 className="text-lg md:text-2xl font-serif text-white uppercase tracking-widest leading-none text-center">Mi Calendario</h1>
          <h2 className="text-[10px] md:text-sm text-gold capitalize mt-1 md:mt-1.5">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
        </div>

        <div className="flex items-center gap-1 md:gap-2 mt-1 md:mt-0">
          <button onClick={nextMonth} className="p-1.5 md:p-2 text-white hover:text-gold transition-colors border border-white/10 hover:border-gold mr-1 md:mr-2">
            <FiChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          
          <button 
            onClick={() => {
              if (!currentUser) return;
              const link = `${window.location.origin}/band/${currentUser.uid}/calendar`;
              const text = `¡Hola! Aquí tenéis el calendario de nuestros bolos y disponibilidad en Sona Empordà: ${link}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            }}
            className="flex items-center justify-center bg-white/5 text-white/50 border border-white/10 hover:bg-gold hover:text-black hover:border-gold transition-colors w-7 h-7 md:w-8 md:h-8 rounded-full shrink-0"
            title="Compartir con la Banda"
          >
            <FiSend className="w-3 h-3 md:w-3.5 md:h-3.5" />
          </button>
          
          {activeSosCount > 0 && (
            <button 
              onClick={() => navigate('/musician/sos')}
              className="relative p-1.5 md:p-2 bg-red-600/20 text-red-500 border border-red-500/50 hover:bg-red-600 hover:text-white transition-colors rounded-full animate-pulse"
              title={`${activeSosCount} SOS Activos`}
            >
              <FiAlertTriangle className="w-3 h-3 md:w-4 md:h-4" />
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {activeSosCount}
              </span>
            </button>
          )}
          {activeCollabCount > 0 && (
            <button 
              onClick={() => navigate('/musician/sos')}
              className="relative p-1.5 md:p-2 bg-green-900/40 text-green-400 border border-green-500/50 hover:bg-green-600 hover:text-white transition-colors rounded-full"
              title={`${activeCollabCount} Nuevos Anuncios`}
            >
              <FiUsers className="w-3 h-3 md:w-4 md:h-4" />
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {activeCollabCount}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-black border border-white/10 p-2 md:p-6 shadow-2xl w-full overflow-hidden">


        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 w-full">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="text-center text-gold text-[9px] md:text-[10px] uppercase tracking-widest font-bold pb-2 border-b border-white/10 truncate">
              {day}
            </div>
          ))}
        </div>

        {/* Cuadrícula */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 w-full">
          {/* Espacios vacíos al principio del mes */}
          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-[4/5] opacity-0"></div>
          ))}

          {/* Días del mes */}
          {days.map((day) => {
            const dateKey = format(day, dateFormat);
            const status = calendar[dateKey];
            const isToday = isSameDay(day, new Date());

            // Find confirmed events to display count
            const myEvents = events.filter(e => e.musicianId === (currentUser?.uid || ""));
            const confirmedEventsToday = myEvents.filter(e => e.date.split('T')[0] === dateKey && (e.status === 'confirmed' || (e.status === 'published' && e.musicianId) || !e.venueId));
            
            const eventOnThisDay = myEvents.find(e => e.date.split('T')[0] === dateKey);
            const isConfirmedEvent = eventOnThisDay && (eventOnThisDay.status === 'confirmed' || (eventOnThisDay.status === 'published' && eventOnThisDay.musicianId) || !eventOnThisDay.venueId);
            const isPendingNegotiation = eventOnThisDay && !isConfirmedEvent && (eventOnThisDay.status === 'pending_musician' || eventOnThisDay.status === 'musician_accepted');

            return (
              <div 
                key={dateKey}
                onClick={() => {
                  if (isPendingNegotiation && eventOnThisDay) {
                    navigate(`/musician/offers`);
                  } else {
                    toggleDayStatus(day);
                  }
                }}
                className={`aspect-[4/5] p-1 md:p-2 border transition-colors cursor-pointer flex flex-col justify-between overflow-hidden relative
                  ${getStatusColor(status)}
                  ${isToday ? 'ring-1 md:ring-2 ring-white ring-inset' : ''}
                  ${(status === 'booked_full' || status === 'booked_partial') || isPendingNegotiation ? 'hover:border-gold hover:text-gold transition-all group' : ''}
                `}
              >
                {isPendingNegotiation && (
                  <div className="absolute top-1 right-1 w-2 h-2 md:w-2.5 md:h-2.5 bg-gold rounded-full animate-pulse shadow-[0_0_8px_rgba(197,160,89,0.8)] z-20"></div>
                )}
                
                <span className="text-xs md:text-lg font-serif z-10 relative">{format(day, 'd')}</span>
                
                {(status === 'booked_full' || status === 'booked_partial' || status === 'unavailable') && (
                  <div className="mt-auto z-10 relative flex flex-col">
                     {confirmedEventsToday.length > 1 && (
                        <span className="text-[10px] font-bold text-white bg-black/50 px-1 rounded-sm w-max mb-0.5">{confirmedEventsToday.length} Bolos</span>
                     )}
                     <span className="text-[7px] md:text-[9px] uppercase tracking-widest font-bold hidden sm:block truncate">
                       {status === 'booked_full' && confirmedEventsToday.length > 0 ? 'Evento' : 
                        status === 'unavailable' || status === 'booked_full' ? 'No Disponible' : 'Admite más'}
                     </span>
                  </div>
                )}
                
                {isPendingNegotiation && (
                  <span className="text-[7px] md:text-[9px] text-gold uppercase tracking-widest font-bold mt-auto hidden sm:block transition-colors truncate z-10 relative">
                    Invitación
                  </span>
                )}
                
                {(!status || status === 'available') && !isPendingNegotiation && (
                  <span className="text-[7px] md:text-[9px] uppercase tracking-widest mt-auto hidden sm:block opacity-50 truncate z-10 relative">
                    Libre
                  </span>
                )}
              </div>
            );
          })}
        </div>

      </div>
      
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-[9px] uppercase tracking-widest font-bold bg-white/5 p-4 border border-white/10 w-full">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white/5 border border-white/20 shrink-0"></div> Libre por defecto
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-800/60 border border-red-400 shrink-0"></div> No Disponible
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[linear-gradient(135deg,rgba(153,27,27,0.8)_50%,rgba(255,255,255,0.05)_50%)] border border-white/40 shrink-0"></div> Bolo (Admite más)
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white/5 border border-white/20 shrink-0 flex items-center justify-center relative">
               <div className="absolute w-1.5 h-1.5 bg-gold rounded-full animate-pulse shadow-[0_0_4px_rgba(197,160,89,0.8)]"></div>
            </div> 
            Pendiente Local
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 flex gap-4 items-start">
          <FiInfo className="text-gold w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-xs text-white/60 leading-relaxed">
            Por defecto, todos los días constan como <strong className="text-white">Libres</strong>. Haz clic en cualquier día libre para bloquearlo como <strong className="text-red-400">No Disponible</strong> (rojo). Si un local te confirma un bolo, el día pasará a ser rojo automáticamente. Si quieres hacer "doblete" y buscar un segundo concierto ese mismo día, haz clic en el bolo confirmado para volver a abrir la fecha.
          </p>
        </div>
      </div>

      {/* Modal de Gestión de Evento Confirmado */}
      {selectedManageDate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif text-white flex items-center gap-2">
                <FiCheckCircle className="text-green-500" />
                Gestión del Día
              </h3>
              <button 
                onClick={() => setSelectedManageDate(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const myEvents = events.filter(e => e.musicianId === currentUser?.uid);
              const eventOnThisDay = myEvents.find(e => e.date.split('T')[0] === selectedManageDate);
              const currentStatus = calendar[selectedManageDate];
              
              if (!eventOnThisDay) {
                return (
                  <div className="text-center pb-4">
                    <p className="text-white/60 text-sm mb-4">Día marcado como No Disponible (sin evento asociado).</p>
                    <button 
                      onClick={async () => {
                        await updateDayStatus(selectedManageDate, null);
                        setSelectedManageDate(null);
                      }}
                      className="w-full bg-white text-black font-bold uppercase tracking-widest text-[10px] py-3 transition-colors hover:bg-white/90"
                    >
                      Liberar Día
                    </button>
                  </div>
                );
              }

              return (
                <div className="flex flex-col gap-4">
                  <div 
                    onClick={() => {
                      if (eventOnThisDay) {
                        setEventToView(eventOnThisDay);
                      }
                    }}
                    className="bg-white/5 border border-white/10 p-4 mb-2 cursor-pointer hover:bg-white/10 hover:border-gold transition-all group"
                  >
                    <p className="text-white/60 text-xs uppercase tracking-widest mb-1 flex justify-between items-center">
                      {eventOnThisDay.venueId === 'external_booking' ? 'Contratación Privada' : 'Evento Confirmado'}
                      <span className="text-[9px] text-gold opacity-0 group-hover:opacity-100 transition-opacity">Ver Detalles →</span>
                    </p>
                    <p className="text-white font-bold text-lg group-hover:text-gold transition-colors">{eventOnThisDay.title}</p>
                    <p className="text-white/40 text-sm">
                      {eventOnThisDay.venueId === 'external_booking' && eventOnThisDay.externalContact
                        ? `${eventOnThisDay.externalContact.name} - ${eventOnThisDay.externalContact.type}`
                        : eventOnThisDay.venueName}
                    </p>
                  </div>

                  {eventOnThisDay.venueId !== 'external_booking' && (
                    <button 
                      onClick={async () => {
                        if (!eventOnThisDay.venueId) {
                          navigate('/musician/messages');
                          return;
                        }
                        const chatId = await findOrCreateChat(eventOnThisDay.venueId, eventOnThisDay.id);
                        navigate('/musician/messages', { state: { chatId } });
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-white/10 text-white font-bold uppercase tracking-widest text-[10px] py-3 hover:bg-white/20 transition-colors"
                    >
                      <FiMessageSquare className="w-4 h-4" /> Abrir Chat con el Local
                    </button>
                  )}

                  <button 
                    onClick={async () => {
                      if (currentStatus === 'booked_full') {
                        await updateDayStatus(selectedManageDate, 'booked_partial');
                      } else {
                        await updateDayStatus(selectedManageDate, 'booked_full');
                      }
                      setSelectedManageDate(null);
                    }}
                    className="w-full bg-white/10 text-white font-bold uppercase tracking-widest text-[10px] py-3 hover:bg-white/20 transition-colors"
                  >
                    {currentStatus === 'booked_full' ? 'Permitir Doblete (Admitir Más)' : 'Cerrar Fecha (No Admitir Más)'}
                  </button>

                  <div className="h-px bg-white/10 my-2"></div>

                  <button 
                    onClick={async () => {
                      if (!window.confirm('¿Estás seguro de cancelar tu actuación? Se avisará automáticamente al local.')) return;
                      try {
                        await updateDoc(doc(db, 'events', eventOnThisDay.id), {
                          status: 'musician_cancelled',
                          musicianId: null,
                          musicianName: null,
                          applicants: arrayRemove(currentUser!.uid),
                          cancelledByMusicianId: currentUser!.uid,
                          cancelledByMusicianName: userData?.stageName || 'Un músico'
                        });

                        if (eventOnThisDay.venueId && eventOnThisDay.venueId !== 'external_booking') {
                          const chatId = await findOrCreateChat(eventOnThisDay.venueId, eventOnThisDay.id);
                          const formattedDate = format(new Date(eventOnThisDay.date), "d 'de' MMMM", { locale: es });
                          const cancelMsg = `Hola, lamentablemente no podré actuar en el evento "${eventOnThisDay.title}" del ${formattedDate}. Mi actuación queda anulada.`;
                          await sendMessage(chatId, cancelMsg);
                        }
                        
                        await updateDayStatus(selectedManageDate, null);
                        setSelectedManageDate(null);
                      } catch (err) {
                        console.error(err);
                        alert("Error al cancelar la actuación.");
                      }
                    }}
                    className="w-full bg-red-900/30 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white font-bold uppercase tracking-widest text-[10px] py-3 transition-colors"
                  >
                    Cancelar mi Actuación
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Visor de Detalles del Evento */}
      {eventToView && (
        <EventViewModal 
          event={eventToView} 
          onClose={() => setEventToView(null)} 
        />
      )}

    </div>
  );
};
