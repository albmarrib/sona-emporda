import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { FiAward } from "react-icons/fi";
import { Heart } from "lucide-react";
import { useFavorites } from "../../hooks/useFavorites";
import type { SonaEvent } from "../../types";

interface EventCardProps {
  event: SonaEvent;
}

export const EventCard = ({ event }: EventCardProps) => {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const dateObj = event.date ? parseISO(event.date) : new Date();
  if (isNaN(dateObj.getTime())) return null;

  const isCancelled = event.status === 'cancelled';

  return (
    <article 
      onClick={() => isCancelled ? null : navigate(`/event/${event.id}`)}
      className={`group relative flex flex-col md:flex-row gap-6 border-b border-white/10 py-10 transition-colors duration-500 ${isCancelled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'}`}
    >
      {isCancelled && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white font-bold text-2xl md:text-4xl px-8 py-2 border-y-4 border-black -rotate-12 z-30 shadow-2xl tracking-[0.2em] whitespace-nowrap">
          CANCELADO
        </div>
      )}
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
        {(event as any).sponsorTier && (event as any).sponsorTier > 0 && (
          <div className="absolute bottom-4 left-4 bg-gold/90 text-black text-[9px] uppercase tracking-widest px-2 py-1 font-bold rounded-sm shadow-lg flex items-center gap-1 backdrop-blur-sm">
            <FiAward className="w-3 h-3" /> Patrocinado
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between py-2">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-wrap gap-2">
              {(event.vibes || event.tags || []).map((vibe) => (
                <span key={vibe} className="text-white/40 text-[9px] uppercase tracking-[0.2em] border border-white/10 px-2 py-1">
                  {vibe.replace(/[^\w\s]/gi, '')}
                </span>
              ))}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(event.id);
              }}
              className="p-2 -mr-2 -mt-2 hover:bg-white/10 rounded-full transition-colors group/fav"
              aria-label={isFavorite(event.id) ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
              <Heart 
                className={`w-6 h-6 transition-colors ${
                  isFavorite(event.id) 
                    ? "fill-red-500 text-red-500" 
                    : "text-white/40 group-hover/fav:text-white"
                }`} 
              />
            </button>
          </div>
          
          <p className="text-gold text-xs font-bold uppercase tracking-widest mb-1 truncate">
            CONCIERTO
          </p>
          {event.title && (
            <h3 className="text-2xl md:text-3xl font-serif text-white mb-3 group-hover:text-gold transition-colors duration-300">
              {event.title}
            </h3>
          )}
          {event.musicianName ? (
            <p className="text-white/80 text-sm font-bold mb-3 truncate">
              Artista / Grupo: <span className="text-gold font-normal">{event.musicianName}</span>
            </p>
          ) : (
            <p className="text-white/80 text-sm font-bold mb-3 truncate">
              Artista / Grupo: <span className="text-white/50 font-normal italic">Banda por confirmar</span>
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
