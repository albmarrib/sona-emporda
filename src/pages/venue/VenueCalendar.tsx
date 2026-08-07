import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiMusic, FiStar, FiMessageSquare } from 'react-icons/fi';
import { mockEvents } from '../../data/mockEvents';
import { mockMusicianProfile, mockMusicianCalendar } from '../../data/mockMusicianData';

// Mocked musicians to simulate explicit and implicit availability
const allMockMusicians = [
  { ...mockMusicianProfile, calendar: mockMusicianCalendar },
  { 
    id: "musician-456", 
    stageName: "Midnight Jazz Trio", 
    mainGenre: "Jazz",
    profileImageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400",
    rating: 4.5,
    reviewsCount: 8,
    calendar: { '2026-08-15': 'booked', '2026-08-25': 'available' } as Record<string, string>
  },
  { 
    id: "musician-789", 
    stageName: "DJ Riera", 
    mainGenre: "Electrónica",
    profileImageUrl: "https://images.unsplash.com/photo-1542222835-300b12bc173c?auto=format&fit=crop&q=80&w=400",
    rating: 4.8,
    reviewsCount: 32,
    calendar: {} as Record<string, string> // No events = implicit availability
  }
];

export const VenueCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // August 2026 for mock data
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get Venue's own events (simulating 'Sala Soho')
  const venueEvents = mockEvents.filter(e => e.venueName === 'Sala Soho');

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Determine availability when a date is selected
  const dateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  
  const explicitlyAvailable = dateKey ? allMockMusicians.filter(m => m.calendar[dateKey] === 'available') : [];
  const implicitlyAvailableStrict = dateKey ? allMockMusicians.filter(m => m.calendar[dateKey] === undefined) : [];

  return (
    <div className="flex flex-col xl:flex-row gap-8 max-w-7xl mx-auto h-[calc(100vh-10rem)]">
      
      {/* Calendar Section */}
      <div className="flex-1 flex flex-col bg-zinc-950 border border-white/10 p-6 shadow-2xl h-full overflow-y-auto">
        
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
          <div>
            <h1 className="text-2xl font-serif text-white">Calendario Consolidado</h1>
            <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">
              Cruza tus fechas con la disponibilidad de los artistas
            </p>
          </div>
          <div className="flex gap-4">
            <button onClick={prevMonth} className="p-2 border border-white/10 hover:border-gold hover:text-gold transition-colors">
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-40 text-center">
              <p className="text-lg font-serif text-white capitalize">{format(currentDate, 'MMMM', { locale: es })}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-widest">{format(currentDate, 'yyyy')}</p>
            </div>
            <button onClick={nextMonth} className="p-2 border border-white/10 hover:border-gold hover:text-gold transition-colors">
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-white/10 mb-px">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
            <div key={day} className="bg-zinc-950 text-center py-2 text-[10px] uppercase tracking-widest font-bold text-white/40">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-white/10 flex-1">
          {daysInMonth.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const hasEvent = venueEvents.some(e => format(parseISO(e.date), 'yyyy-MM-dd') === dayKey);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <div 
                key={dayKey}
                onClick={() => setSelectedDate(day)}
                className={`bg-zinc-950 p-2 relative cursor-pointer hover:bg-white/5 transition-colors flex flex-col items-center justify-start gap-1 ${!isCurrentMonth ? 'opacity-20' : ''} ${isSelected ? 'ring-2 ring-gold ring-inset z-10 bg-gold/5' : ''}`}
              >
                <span className={`text-sm ${isSelected ? 'text-gold font-bold' : 'text-white/80'}`}>
                  {format(day, 'd')}
                </span>
                
                {hasEvent && (
                  <div className="w-full mt-2 flex justify-center">
                    <div className="bg-gold/20 border border-gold/50 text-gold text-[8px] uppercase tracking-widest px-1 py-0.5 rounded flex items-center gap-1 w-full justify-center">
                      <FiMusic />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 flex gap-6 text-[10px] uppercase tracking-widest text-white/50">
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 bg-gold/20 border border-gold/50 rounded flex items-center justify-center"><FiMusic className="text-gold w-2 h-2" /></div>
             Tienes evento programado
           </div>
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 border-2 border-gold rounded-full"></div>
             Día seleccionado
           </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="w-full xl:w-[400px] flex flex-col h-full bg-black border-l border-white/10">
        {!selectedDate ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/40">
            <FiCalendar className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">Selecciona un día en el calendario para buscar artistas disponibles para esa fecha.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-zinc-950">
              <h2 className="text-2xl font-serif text-white">
                {format(selectedDate, "d 'de' MMMM", { locale: es })}
              </h2>
              <p className="text-gold text-[10px] uppercase tracking-widest mt-1 font-bold">
                Candidatos Disponibles
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
              
              {/* Explicitly Available */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-green-500 text-[10px] uppercase tracking-widest font-bold">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  Quieren Bolo Hoy ({explicitlyAvailable.length})
                </div>
                
                {explicitlyAvailable.length === 0 ? (
                  <p className="text-white/30 text-xs italic">Nadie lo ha marcado explícitamente.</p>
                ) : (
                  explicitlyAvailable.map(artist => (
                    <ArtistCard key={`exp-${artist.id}`} artist={artist} badge="¡Ganas de tocar!" />
                  ))
                )}
              </div>

              <div className="h-px bg-white/10 w-full my-2"></div>

              {/* Implicitly Available */}
              <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-2 text-white/50 text-[10px] uppercase tracking-widest font-bold">
                  <div className="w-2 h-2 rounded-full border border-white/50"></div>
                  Tienen el día libre ({implicitlyAvailableStrict.length})
                </div>
                
                {implicitlyAvailableStrict.length === 0 ? (
                  <p className="text-white/30 text-xs italic">No hay más artistas libres.</p>
                ) : (
                  implicitlyAvailableStrict.map(artist => (
                    <ArtistCard key={`imp-${artist.id}`} artist={artist} badge="Agenda Libre" />
                  ))
                )}
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  );
};

// Mini component for the side cards
const ArtistCard = ({ artist, badge }: { artist: any, badge: string }) => {
  const imageUrl = artist.profileImageUrl || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400';
  
  return (
    <div className="bg-zinc-950 border border-white/10 p-4 hover:border-gold/50 transition-colors flex flex-col gap-3 group cursor-pointer relative overflow-hidden">
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-white/10 group-hover:border-gold transition-colors">
          <img src={imageUrl} alt={artist.stageName} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-serif text-white group-hover:text-gold transition-colors">{artist.stageName}</h3>
          <p className="text-white/50 text-[10px] uppercase tracking-widest">{artist.mainGenre}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
         <div className="flex items-center gap-1 text-gold">
            <FiStar className="w-3 h-3 fill-gold" />
            <span className="font-bold text-xs ml-1">{artist.rating.toFixed(1)}</span>
            <span className="text-white/40 text-[9px]">({artist.reviewsCount})</span>
          </div>
          <span className="text-[9px] uppercase tracking-widest px-2 py-1 bg-white/5 text-white/70 border border-white/10 rounded-sm">
            {badge}
          </span>
      </div>

      {/* Hover action overlay */}
      <div className="absolute inset-0 bg-gold/90 translate-y-full group-hover:translate-y-0 transition-transform flex items-center justify-center duration-300">
         <button className="flex items-center gap-2 text-black font-bold text-[10px] uppercase tracking-widest">
           <FiMessageSquare className="w-4 h-4" /> Contactar
         </button>
      </div>
    </div>
  );
}
