import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import type { SonaEvent } from "../../data/mockEvents";

interface EventCardProps {
  event: SonaEvent;
}

export const EventCard = ({ event }: EventCardProps) => {
  const navigate = useNavigate();
  const dateObj = event.date ? parseISO(event.date) : new Date();
  if (isNaN(dateObj.getTime())) return null;

  return (
    <article 
      onClick={() => navigate(`/event/${event.id}`)}
      className="group relative flex flex-col md:flex-row gap-6 border-b border-white/10 py-10 hover:bg-white/5 transition-colors duration-500 cursor-pointer"
    >
      {/* Date Column (Desktop) */}
      <div className="hidden md:flex flex-col shrink-0 w-32 justify-start pt-2">
        <span className="text-white/40 text-[10px] uppercase tracking-widest mb-1">
          {format(dateObj, "MMM", { locale: es })}
        </span>
        <span className="text-4xl font-serif text-white group-hover:text-gold transition-colors duration-300">
          {format(dateObj, "dd")}
        </span>
      </div>

      {/* Image */}
      <div className="w-full md:w-64 h-48 md:h-full shrink-0 overflow-hidden relative">
        <img 
          src={event.imageUrl} 
          alt={event.title} 
          className="w-full h-full object-cover grayscale opacity-70 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700"
        />
        {/* Date Overlay (Mobile) */}
        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-2 md:hidden border border-white/10">
          <div className="text-white text-lg font-serif">{format(dateObj, "dd MMM", { locale: es })}</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between py-2">
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            {(event.vibes || event.tags || []).map((vibe) => (
              <span key={vibe} className="text-white/40 text-[9px] uppercase tracking-[0.2em] border border-white/10 px-2 py-1">
                {vibe.replace(/[^\w\s]/gi, '')}
              </span>
            ))}
          </div>
          
          <p className="text-gold text-xs font-bold uppercase tracking-widest mb-1 truncate">
            CONCIERTO
          </p>
          {event.title && (
            <h3 className="text-2xl md:text-3xl font-serif text-white mb-3 group-hover:text-gold transition-colors duration-300">
              {event.title}
            </h3>
          )}
          {event.musicianName && (
            <p className="text-white/80 text-sm font-bold mb-3 truncate">
              Artista / Grupo: <span className="text-gold font-normal">{event.musicianName}</span>
            </p>
          )}
          
          <p className="text-white/60 text-[10px] uppercase tracking-widest flex items-center gap-2">
            <span>{format(dateObj, "HH:mm")}h</span>
            <span className="text-white/20">|</span>
            <span>{event.venueName}</span>
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <span className="text-gold text-[10px] uppercase tracking-[0.2em] font-bold">
            {event.ticketType}
          </span>
          <span className="text-white text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-b border-gold pb-0.5">
            Ver Detalles →
          </span>
        </div>
      </div>
    </article>
  );
};
