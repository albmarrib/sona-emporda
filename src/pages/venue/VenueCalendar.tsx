import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiMusic, FiStar, FiMessageSquare } from 'react-icons/fi';
import { useEvents } from '../../hooks/useEvents';
import { allMockMusicians } from '../../data/mockMusicianData';
import { useAuth } from '../../contexts/AuthContext';
import { EPKModal } from '../../components/shared/EPKModal';

// Mocked musicians to simulate explicit and implicit availability


export const VenueCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // August 2026 for mock data
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<any | null>(null);
  
  const { events } = useEvents(true);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const { userData, currentUser } = useAuth();
  
  // Get Venue's own events
  const venueName = userData?.name || 'Sala Soho';
  const venueId = currentUser?.uid;
  const venueEvents = events.filter(e => (e.venueId && e.venueId === venueId) || (e.venueName && e.venueName === venueName));

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Determine availability when a date is selected
  const dateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  
  const explicitlyAvailable = dateKey ? allMockMusicians.filter(m => m.calendar[dateKey] === 'available') : [];
  const implicitlyAvailableStrict = dateKey ? allMockMusicians.filter(m => m.calendar[dateKey] === undefined) : [];

  return (
    <div className="flex flex-col xl:flex-row gap-6 md:gap-8 max-w-7xl mx-auto xl:h-[calc(100vh-8rem)] w-full">
      
      {/* Calendar Section */}
      <div className="flex-1 flex flex-col bg-black border border-white/10 p-4 md:p-6 shadow-2xl overflow-hidden w-full">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 border-b border-white/10 pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-serif text-white">Calendario Consolidado</h1>
            <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">
              Cruza tus fechas con la disponibilidad de los artistas
            </p>
          </div>
          <div className="flex gap-2 md:gap-4 items-center w-full md:w-auto justify-between md:justify-end">
            <button onClick={prevMonth} className="p-2 border border-white/10 hover:border-gold hover:text-gold transition-colors">
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-32 md:w-40 text-center">
              <p className="text-lg font-serif text-white capitalize truncate">{format(currentDate, 'MMMM', { locale: es })}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-widest">{format(currentDate, 'yyyy')}</p>
            </div>
            <button onClick={nextMonth} className="p-2 border border-white/10 hover:border-gold hover:text-gold transition-colors">
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-px bg-white/10 mb-1 md:mb-px w-full">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="bg-black text-center py-2 text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-white/40 truncate">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-px bg-white/10 w-full mb-4 md:mb-0">
          {daysInMonth.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const hasEvent = venueEvents.some(e => format(parseISO(e.date), 'yyyy-MM-dd') === dayKey);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <div 
                key={dayKey}
                onClick={() => setSelectedDate(day)}
                className={`bg-black aspect-square p-1 md:p-2 relative cursor-pointer hover:bg-white/5 transition-colors flex flex-col items-center justify-start gap-1 overflow-hidden ${!isCurrentMonth ? 'opacity-20' : ''} ${isSelected ? 'ring-1 md:ring-2 ring-gold ring-inset z-10 bg-gold/5' : ''}`}
              >
                <span className={`text-xs md:text-sm font-serif ${isSelected ? 'text-gold font-bold' : 'text-white/80'}`}>
                  {format(day, 'd')}
                </span>
                
                {hasEvent && (
                  <div className="w-full mt-auto mb-1 flex justify-center">
                    <div className="bg-gold/20 border border-gold/50 text-gold text-[8px] uppercase tracking-widest px-1 py-0.5 rounded flex items-center gap-1 justify-center w-full md:w-auto">
                      <FiMusic className="w-3 h-3 md:w-2 md:h-2 shrink-0" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-auto pt-4 flex flex-wrap gap-4 text-[9px] uppercase tracking-widest text-white/50 bg-white/5 p-4 border border-white/10 w-full">
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 bg-gold/20 border border-gold/50 rounded flex items-center justify-center shrink-0"><FiMusic className="text-gold w-2 h-2" /></div>
             Tienes evento programado
           </div>
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 border-2 border-gold rounded-full shrink-0"></div>
             Día seleccionado
           </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="w-full xl:w-[400px] flex flex-col bg-black border border-white/10 shrink-0">
        {!selectedDate ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/40 min-h-[300px]">
            <FiCalendar className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">Selecciona un día en el calendario para buscar artistas disponibles para esa fecha.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 md:p-6 border-b border-white/10 bg-white/5">
              <h2 className="text-xl md:text-2xl font-serif text-white">
                {format(selectedDate, "d 'de' MMMM", { locale: es })}
              </h2>
              <p className="text-gold text-[10px] uppercase tracking-widest mt-1 font-bold">
                Candidatos Disponibles
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-8">
              
              {/* Explicitly Available */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-green-500 text-[10px] uppercase tracking-widest font-bold">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></div>
                  Quieren Bolo Hoy ({explicitlyAvailable.length})
                </div>
                
                {explicitlyAvailable.length === 0 ? (
                  <p className="text-white/30 text-xs italic">Nadie lo ha marcado explícitamente.</p>
                ) : (
                  explicitlyAvailable.map(artist => (
                    <ArtistCard key={`exp-${artist.id}`} artist={artist} badge="¡Ganas de tocar!" onSelect={() => setSelectedArtist(artist)} />
                  ))
                )}
              </div>

              <div className="h-px bg-white/10 w-full my-1"></div>

              {/* Implicitly Available */}
              <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-2 text-white/50 text-[10px] uppercase tracking-widest font-bold">
                  <div className="w-2 h-2 rounded-full border border-white/50 shrink-0"></div>
                  Tienen el día libre ({implicitlyAvailableStrict.length})
                </div>
                
                {implicitlyAvailableStrict.length === 0 ? (
                  <p className="text-white/30 text-xs italic">No hay más artistas libres.</p>
                ) : (
                  implicitlyAvailableStrict.map(artist => (
                    <ArtistCard key={`imp-${artist.id}`} artist={artist} badge="Agenda Libre" onSelect={() => setSelectedArtist(artist)} />
                  ))
                )}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* EPK Modal */}
      {selectedArtist && (
        <EPKModal 
          artist={selectedArtist} 
          dateKey={dateKey || ''} 
          currentUser={currentUser} 
          onClose={() => setSelectedArtist(null)} 
        />
      )}

    </div>
  );
};

// Mini component for the side cards
const ArtistCard = ({ artist, badge, onSelect }: { artist: any, badge: string, onSelect: () => void }) => {
  const imageUrl = artist.profileImageUrl || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400';
  const [contacted] = useState(false);

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };
  
  return (
    <div onClick={onSelect} className="bg-zinc-950 border border-white/10 p-4 hover:border-gold/50 transition-colors flex flex-col gap-3 group cursor-pointer relative overflow-hidden">
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-white/10 group-hover:border-gold transition-colors">
          <img src={imageUrl} alt={artist.stageName} className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 transition-opacity" />
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
         <button onClick={handleContact} disabled={contacted} className="flex items-center gap-2 text-black font-bold text-[10px] uppercase tracking-widest">
           <FiMessageSquare className="w-4 h-4" /> {contacted ? 'Contactado' : 'Contactar y Ver EPK'}
         </button>
      </div>
    </div>
  );
}
