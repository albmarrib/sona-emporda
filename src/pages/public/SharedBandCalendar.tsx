import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiMapPin, FiMusic, FiInfo } from 'react-icons/fi';
import { db } from '../../firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { EventViewModal } from '../../components/shared/EventViewModal';

export const SharedBandCalendar = () => {
  const { bandId } = useParams();
  const [bandData, setBandData] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [eventToView, setEventToView] = useState<any | null>(null);

  useEffect(() => {
    const fetchBandData = async () => {
      if (!bandId) return;
      try {
        const bandDoc = await getDoc(doc(db, 'users', bandId));
        if (bandDoc.exists()) {
          setBandData(bandDoc.data());
        }

        const eventsQuery = query(collection(db, 'events'), where('musicianId', '==', bandId));
        const eventsSnap = await getDocs(eventsQuery);
        const fetchedEvents = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error al cargar datos de la banda:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBandData();
  }, [bandId]);

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-gold uppercase tracking-widest text-xs font-bold animate-pulse">Cargando Calendario...</div>;
  }

  if (!bandData) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-red-500 uppercase tracking-widest text-xs">Banda no encontrada</div>;
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const dateFormat = "yyyy-MM-dd";
  const calendar = bandData.calendar || {};

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'unavailable': return 'bg-red-800/60 text-red-300 border-red-400';
      case 'booked_full': return 'bg-red-800/80 text-white border-red-500';
      case 'booked_partial': return 'bg-[linear-gradient(135deg,rgba(153,27,27,0.8)_50%,rgba(255,255,255,0.05)_50%)] text-white border-white/40';
      default: return 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-4 md:p-8">
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">
        
        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-gold shrink-0">
            <img 
              src={bandData.profileImageUrl || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80'} 
              alt={bandData.stageName} 
              className="w-full h-full object-cover grayscale"
            />
          </div>
          <div>
            <h1 className="text-2xl font-serif text-white">{bandData.stageName || bandData.name}</h1>
            <p className="text-gold text-[10px] uppercase tracking-widest flex items-center gap-1 mt-1">
              <FiCalendar /> Calendario de la Banda
            </p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 text-white hover:text-gold transition-colors">
              <FiChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-serif text-white capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 text-white hover:text-gold transition-colors">
              <FiChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="text-center text-gold text-[9px] uppercase tracking-widest font-bold pb-2 border-b border-white/10">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square"></div>
            ))}

            {days.map((day) => {
              const dateKey = format(day, dateFormat);
              const status = calendar[dateKey];
              const isToday = isSameDay(day, new Date());
              
              const confirmedEventsToday = events.filter(e => e.date.split('T')[0] === dateKey && (e.status === 'confirmed' || (e.status === 'published' && e.musicianId) || !e.venueId));
              const eventOnThisDay = events.find(e => e.date.split('T')[0] === dateKey);

              return (
                <div 
                  key={dateKey}
                  onClick={() => {
                    if (eventOnThisDay) setEventToView(eventOnThisDay);
                  }}
                  className={`aspect-square p-1 border transition-colors flex flex-col justify-between relative
                    ${getStatusColor(status)}
                    ${isToday ? 'ring-1 ring-white ring-inset' : ''}
                    ${eventOnThisDay ? 'cursor-pointer hover:border-gold group' : ''}
                  `}
                >
                  <span className="text-xs md:text-sm font-serif z-10">{format(day, 'd')}</span>
                  
                  {(status === 'booked_full' || status === 'booked_partial' || status === 'unavailable') && (
                    <div className="mt-auto z-10 flex flex-col">
                       {confirmedEventsToday.length > 1 && (
                          <span className="text-[9px] font-bold text-white bg-black/50 px-1 rounded-sm w-max mb-0.5">{confirmedEventsToday.length}</span>
                       )}
                       <span className="text-[7px] uppercase tracking-widest font-bold hidden sm:block truncate">
                         {status === 'booked_full' && confirmedEventsToday.length > 0 ? 'Bolo' : 
                          status === 'unavailable' || status === 'booked_full' ? 'No Disp.' : 'Admite más'}
                       </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 flex gap-4 items-start">
          <FiInfo className="text-gold w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-xs text-white/60 leading-relaxed">
            Estás viendo el calendario compartido de <strong className="text-white">{bandData.stageName}</strong>. Haz clic en los días marcados con bolo para ver los detalles (lugar, hora, etc). Marca estos días en tu propia agenda.
          </p>
        </div>

        <div className="text-center mt-8">
          <Link to="/" className="text-gold text-[10px] uppercase tracking-widest hover:text-white transition-colors">
            Sona Empordà
          </Link>
        </div>
      </div>

      {eventToView && (
        <EventViewModal 
          event={eventToView} 
          onClose={() => setEventToView(null)} 
        />
      )}
    </div>
  );
};
