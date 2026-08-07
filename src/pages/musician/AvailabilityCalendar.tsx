import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiChevronLeft, FiChevronRight, FiInfo } from 'react-icons/fi';
import { useMusicianCalendar } from '../../hooks/useMusicianCalendar';
import type { DayStatus } from '../../data/mockMusicianData';
import { useNavigate } from 'react-router-dom';
import { mockEvents } from '../../data/mockEvents';

export const AvailabilityCalendar = () => {
  const navigate = useNavigate();
  const { calendar, loading, updateDayStatus } = useMusicianCalendar();
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
      case 'available': return 'bg-green-900/40 text-green-400 border-green-500/50';
      case 'unavailable': return 'bg-red-900/40 text-red-400 border-red-500/50';
      case 'booked': return 'bg-gold/20 text-gold border-gold font-bold';
      default: return 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10';
    }
  };

  if (loading) {
    return <div className="text-gold animate-pulse text-xs uppercase tracking-widest font-bold">Cargando calendario...</div>;
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      
      <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white mb-2">Mi Disponibilidad</h1>
          <p className="text-white/50 text-xs uppercase tracking-widest">
            Marca los días que tienes libres o bloqueados.
          </p>
        </div>
        
        {/* Leyenda */}
        <div className="flex gap-4 text-[9px] uppercase tracking-widest font-bold">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white/5 border border-white/20"></div> No definido
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-900/40 border border-green-500/50"></div> Buscando Bolo
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-900/40 border border-red-500/50"></div> No Disponible
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gold/20 border border-gold"></div> Confirmado
          </div>
        </div>
      </div>

      <div className="bg-black border border-white/10 p-6 md:p-10 shadow-2xl">
        
        {/* Header Calendario */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={prevMonth} className="p-2 text-white hover:text-gold transition-colors border border-white/10 hover:border-gold">
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-serif text-white capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
          <button onClick={nextMonth} className="p-2 text-white hover:text-gold transition-colors border border-white/10 hover:border-gold">
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="text-center text-gold text-[10px] uppercase tracking-widest font-bold pb-2 border-b border-white/10">
              {day}
            </div>
          ))}
        </div>

        {/* Cuadrícula */}
        <div className="grid grid-cols-7 gap-2">
          {/* Espacios vacíos al principio del mes */}
          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-24 md:h-32 opacity-0"></div>
          ))}

          {/* Días del mes */}
          {days.map((day) => {
            const dateKey = format(day, dateFormat);
            const status = calendar[dateKey];
            const isToday = isSameDay(day, new Date());

            // Check if there is an event on this date
            const myEvents = mockEvents.filter(e => e.musicianId === "musician-123");
            const eventOnThisDay = myEvents.find(e => e.date.split('T')[0] === dateKey);

            return (
              <div 
                key={dateKey}
                onClick={() => {
                  if (status === 'booked' && eventOnThisDay) {
                    navigate(`/event/${eventOnThisDay.id}`);
                  } else {
                    toggleDayStatus(day);
                  }
                }}
                className={`h-24 md:h-32 p-2 border transition-colors cursor-pointer flex flex-col justify-between
                  ${getStatusColor(status)}
                  ${isToday ? 'ring-2 ring-white ring-inset' : ''}
                  ${status === 'booked' ? 'hover:bg-gold hover:text-black hover:border-white transition-all group' : ''}
                `}
              >
                <span className="text-lg font-serif">{format(day, 'd')}</span>
                
                {status === 'booked' && (
                  <span className="text-[9px] uppercase tracking-widest font-bold mt-auto hidden md:block group-hover:text-black transition-colors">
                    Ver Evento
                  </span>
                )}
                
                {status === 'available' && (
                  <span className="text-[9px] uppercase tracking-widest mt-auto hidden md:block opacity-70">
                    Buscando
                  </span>
                )}
              </div>
            );
          })}
        </div>

      </div>
      
      <div className="bg-white/5 border border-white/10 p-4 flex gap-4 items-start">
        <FiInfo className="text-gold w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-xs text-white/60 leading-relaxed">
          Haz clic en cualquier día para alternar entre <strong className="text-green-400">Buscando Bolo</strong> (verde) y <strong className="text-red-400">No Disponible</strong> (rojo). Si dejas el día en blanco, simplemente significa que no tienes preferencia. Los días dorados son conciertos que ya tienes confirmados a través de Sona Empordà y no se pueden modificar manualmente.
        </p>
      </div>

    </div>
  );
};
