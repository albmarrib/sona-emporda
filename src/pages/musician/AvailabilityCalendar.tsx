import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiChevronLeft, FiChevronRight, FiInfo } from 'react-icons/fi';
import { useMusicianCalendar } from '../../hooks/useMusicianCalendar';
import type { DayStatus } from '../../data/mockMusicianData';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../../hooks/useEvents';

export const AvailabilityCalendar = () => {
  const navigate = useNavigate();
  const { events } = useEvents();
  const { calendar, loading, updateDayStatus, markAllAvailable } = useMusicianCalendar();
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
    
    // Si ya hay un bolo ('booked'), no dejamos cambiarlo desde aquí
    if (currentStatus === 'booked') return;

    let newStatus: DayStatus | null = 'available';
    if (!currentStatus) newStatus = 'available';
    else if (currentStatus === 'available') newStatus = 'unavailable';
    else if (currentStatus === 'unavailable') {
      newStatus = null;
    }

    await updateDayStatus(dateKey, newStatus);
  };

  const getStatusColor = (status?: DayStatus) => {
    switch (status) {
      case 'available': return 'bg-green-800/60 text-green-300 border-green-400 shadow-[inset_0_0_10px_rgba(74,222,128,0.2)]';
      case 'unavailable': return 'bg-red-800/60 text-red-300 border-red-400 shadow-[inset_0_0_10px_rgba(248,113,113,0.2)]';
      case 'booked': return 'bg-gold/20 text-gold border-gold font-bold shadow-[inset_0_0_15px_rgba(197,160,89,0.3)]';
      default: return 'bg-white/5 text-white/70 border-white/20 hover:bg-white/10 hover:border-white/40';
    }
  };

  if (loading) {
    return <div className="text-gold animate-pulse text-xs uppercase tracking-widest font-bold">Cargando calendario...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl overflow-hidden w-full">
      
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-3xl font-serif text-white mb-2">Mi Disponibilidad</h1>
        <p className="text-white/50 text-xs uppercase tracking-widest">
          Asegura tus fechas para recibir propuestas.
        </p>
      </div>

      <div className="bg-black border border-white/10 p-4 md:p-10 shadow-2xl w-full overflow-hidden">
        
        {/* Header Calendario */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={prevMonth} className="p-2 text-white hover:text-gold transition-colors border border-white/10 hover:border-gold">
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl md:text-2xl font-serif text-white capitalize text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
          <button onClick={nextMonth} className="p-2 text-white hover:text-gold transition-colors border border-white/10 hover:border-gold">
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>

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
            <div key={`empty-${idx}`} className="aspect-square opacity-0"></div>
          ))}

          {/* Días del mes */}
          {days.map((day) => {
            const dateKey = format(day, dateFormat);
            const status = calendar[dateKey];
            const isToday = isSameDay(day, new Date());

            // Check if there is an event on this date
            const myEvents = events.filter(e => e.musicianId === "musician-123");
            const eventOnThisDay = myEvents.find(e => e.date.split('T')[0] === dateKey);
            const isConfirmedEvent = eventOnThisDay && (eventOnThisDay.status === 'confirmed' || (eventOnThisDay.status === 'published' && eventOnThisDay.musicianId) || !eventOnThisDay.venueId);
            const isPendingNegotiation = eventOnThisDay && !isConfirmedEvent && (eventOnThisDay.status === 'pending_musician' || eventOnThisDay.status === 'musician_accepted');

            return (
              <div 
                key={dateKey}
                onClick={() => {
                  if (status === 'booked' && eventOnThisDay) {
                    navigate(`/event/${eventOnThisDay.id}`);
                  } else if (isPendingNegotiation && eventOnThisDay) {
                    navigate(`/musician/offers`);
                  } else {
                    toggleDayStatus(day);
                  }
                }}
                className={`aspect-square p-1 md:p-2 border transition-colors cursor-pointer flex flex-col justify-between overflow-hidden relative
                  ${getStatusColor(status)}
                  ${isToday ? 'ring-1 md:ring-2 ring-white ring-inset' : ''}
                  ${status === 'booked' || isPendingNegotiation ? 'hover:bg-gold/40 hover:text-white hover:border-white transition-all group' : ''}
                `}
              >
                {isPendingNegotiation && (
                  <div className="absolute top-1 right-1 w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)] z-20"></div>
                )}
                
                <span className="text-xs md:text-lg font-serif z-10 relative">{format(day, 'd')}</span>
                
                {status === 'booked' && (
                  <span className="text-[7px] md:text-[9px] uppercase tracking-widest font-bold mt-auto hidden sm:block group-hover:text-black transition-colors truncate z-10 relative">
                    Evento
                  </span>
                )}
                
                {isPendingNegotiation && (
                  <span className="text-[7px] md:text-[9px] text-red-300 uppercase tracking-widest font-bold mt-auto hidden sm:block transition-colors truncate z-10 relative">
                    Invitación
                  </span>
                )}
                
                {status === 'available' && !isPendingNegotiation && (
                  <span className="text-[7px] md:text-[9px] uppercase tracking-widest mt-auto hidden sm:block opacity-70 truncate z-10 relative">
                    Libre
                  </span>
                )}
              </div>
            );
          })}
        </div>

      </div>
      
      <div className="flex flex-col gap-4">
        <button 
          onClick={async () => {
            const datesIso = days.map(day => format(day, dateFormat));
            await markAllAvailable(datesIso);
          }}
          className="bg-green-800/60 hover:bg-green-700/80 text-green-300 hover:text-white border border-green-400 transition-colors px-4 py-4 md:py-3 text-[10px] md:text-xs uppercase tracking-widest font-bold w-full md:w-auto self-start flex justify-center items-center shadow-lg"
        >
          + Marcar todo el mes disponible
        </button>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-[9px] uppercase tracking-widest font-bold bg-white/5 p-4 border border-white/10 w-full">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white/5 border border-white/20 shrink-0"></div> No definido
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-800/60 border border-green-400 shrink-0 shadow-[inset_0_0_5px_rgba(74,222,128,0.3)]"></div> Disponible
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-800/60 border border-red-400 shrink-0 shadow-[inset_0_0_5px_rgba(248,113,113,0.3)]"></div> No Disponible
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gold/20 border border-gold shrink-0 shadow-[inset_0_0_5px_rgba(197,160,89,0.4)]"></div> Confirmado
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white/5 border border-white/20 shrink-0 flex items-center justify-center relative">
               <div className="absolute w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_4px_rgba(239,68,68,0.8)]"></div>
            </div> 
            Pendiente Local
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 flex gap-4 items-start">
          <FiInfo className="text-gold w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-xs text-white/60 leading-relaxed">
            Haz clic en cualquier día para alternar entre <strong className="text-green-400">Disponible</strong> (verde) y <strong className="text-red-400">No Disponible</strong> (rojo). Si dejas el día <strong className="text-white">No Definido</strong>, los locales no sabrán tu estado y dudarán en contactarte. Los días dorados son conciertos ya confirmados.
          </p>
        </div>
      </div>

    </div>
  );
};
