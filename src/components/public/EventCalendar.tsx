import { useState, useRef, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import type { SonaEvent } from "../../types";
import { EventCard } from "./EventCard";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface EventCalendarProps {
  events: SonaEvent[];
  selectedVibes: string[];
  showFavorites?: boolean;
  selectedMusician?: string | null;
}
import { useFavorites } from "../../hooks/useFavorites";

export const EventCalendar = ({ events, selectedVibes, showFavorites = false, selectedMusician = null }: EventCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const eventsContainerRef = useRef<HTMLDivElement>(null);
  const { isFavorite } = useFavorites();

  // Auto-scroll en móvil al seleccionar una fecha
  useEffect(() => {
    if (selectedDate && window.innerWidth < 1024 && eventsContainerRef.current) {
      setTimeout(() => {
        eventsContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedDate]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Filtrar eventos globalmente por vibes, favoritos y músicos
  const filteredEvents = events.filter(e => {
    if (showFavorites && !isFavorite(e.id)) return false;
    if (selectedMusician && (e.musicianName || '').trim().toLowerCase() !== selectedMusician.trim().toLowerCase()) return false;
    if (selectedVibes.length === 0) return true;
    return (e.vibes || e.tags || []).some(v => selectedVibes.some(selected => v.toUpperCase().includes(selected)));
  });

  const handlePrevMonth = () => {
    if (!isBefore(startOfMonth(subMonths(currentDate, 1)), startOfMonth(new Date()))) {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const canGoBack = !isBefore(startOfMonth(subMonths(currentDate, 1)), startOfMonth(new Date()));

  const selectedDayEvents = selectedDate 
    ? filteredEvents.filter(e => (e.date && !isNaN(parseISO(e.date).getTime()) && isSameDay(parseISO(e.date), selectedDate)))
    : [];

  return (
    <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-start lg:h-[80vh] min-h-screen lg:min-h-[600px]">
      {/* Calendario (Izquierda en Desktop) */}
      <div className="w-full lg:w-[420px] shrink-0 bg-black border border-white/10 p-6 md:p-8 shadow-2xl h-fit">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={handlePrevMonth} 
            disabled={!canGoBack}
            className={`p-2 transition-colors ${canGoBack ? 'text-white hover:text-gold cursor-pointer' : 'text-white/20'}`}
            title="Mes anterior"
          >
            <FiChevronLeft size={20} />
          </button>
          <h3 className="text-xl font-serif text-white capitalize tracking-wide">
            {format(currentDate, "MMMM yyyy", { locale: es })}
          </h3>
          <button 
            onClick={handleNextMonth}
            className="p-2 text-white hover:text-gold transition-colors cursor-pointer"
            title="Mes siguiente"
          >
            <FiChevronRight size={20} />
          </button>
        </div>

        {/* Acceso rápido para situarse en Hoy */}
        <div className="flex justify-center mb-6">
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              setCurrentDate(startOfMonth(today));
              const todayHasEvents = filteredEvents.some(e => e.date && !isNaN(parseISO(e.date).getTime()) && isSameDay(parseISO(e.date), today));
              if (todayHasEvents) {
                setSelectedDate(today);
              }
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/5 hover:bg-gold/15 border border-gold/40 hover:border-gold rounded-full text-xs text-gold transition-all cursor-pointer shadow-sm active:scale-95"
            title="Situar el calendario en la fecha de hoy"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
            </span>
            <span className="font-medium tracking-wide">Hoy: {format(new Date(), "d 'de' MMMM", { locale: es })}</span>
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center mb-4 border-b border-white/5 pb-2">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
            <div key={day} className="text-gold text-[10px] uppercase tracking-widest font-bold">{day}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2 md:p-3" />
          ))}
          
          {daysInMonth.map(day => {
            const hasEvents = filteredEvents.some(e => (e.date && !isNaN(parseISO(e.date).getTime()) && isSameDay(parseISO(e.date), day)));
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                disabled={!hasEvents}
                className={`
                  relative p-1 md:p-2 flex flex-col items-center justify-center transition-all duration-300 min-h-[48px] rounded-lg
                  ${hasEvents ? 'cursor-pointer hover:bg-white/10' : (isToday ? 'cursor-default' : 'opacity-20 cursor-default')}
                  ${isToday && !isSelected ? 'border-2 border-gold bg-gold/15 shadow-[0_0_15px_rgba(197,160,89,0.25)] ring-1 ring-gold/50' : ''}
                  ${isSelected ? 'bg-gold text-black font-bold shadow-lg shadow-gold/30 border-2 border-gold' : ''}
                  ${!isToday && !isSelected && hasEvents ? 'hover:border hover:border-white/20' : ''}
                `}
                title={isToday ? "Hoy" : undefined}
              >
                {isToday && (
                  <span className={`text-[7px] md:text-[8px] font-bold tracking-widest uppercase leading-none mb-0.5 ${isSelected ? 'text-black' : 'text-gold'}`}>
                    HOY
                  </span>
                )}
                <span className={`text-sm font-serif z-10 ${isSelected ? 'text-black font-bold' : (isToday ? 'text-white font-bold' : 'text-white')}`}>
                  {format(day, "d")}
                </span>
                {hasEvents && !isSelected && (
                  <div className={`mt-0.5 w-1.5 h-1.5 rounded-full ${isToday ? 'bg-gold shadow-sm' : 'bg-gold'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Eventos (Derecha en Desktop) */}
      <div 
        ref={eventsContainerRef}
        className="flex-1 w-full lg:h-full lg:overflow-y-auto lg:overscroll-y-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] lg:pr-4"
      >
        {selectedDate ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h4 className="text-xl md:text-2xl font-serif text-white mb-8 flex items-center gap-4 border-b border-white/10 pb-6 sticky top-0 bg-black z-10 pt-4">
              Eventos <span className="text-gold">— {format(selectedDate, "d 'de' MMMM", { locale: es })}</span>
            </h4>
            
            {selectedDayEvents.length > 0 ? (
              <div className="flex flex-col">
                {selectedDayEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-xs uppercase tracking-widest mt-12 text-center">
                No hay eventos programados para este día.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full border border-white/5 p-12 opacity-50 min-h-[400px]">
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-gold to-transparent mb-6" />
            <p className="text-white text-[10px] uppercase tracking-[0.2em] mb-4 text-center">
              Selecciona una fecha en el calendario
            </p>
            <p className="text-white/40 text-xs font-serif italic text-center max-w-sm">
              Descubre la programación y planifica tu experiencia en el Empordà.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
