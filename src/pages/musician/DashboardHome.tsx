import { useState } from "react";
import { FiClock, FiCheckCircle, FiMapPin, FiEye, FiEyeOff } from "react-icons/fi";
import { useEvents } from "../../hooks/useEvents";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export const DashboardHome = () => {
  const navigate = useNavigate();
  const { events } = useEvents(true);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [eventToEvaluate, setEventToEvaluate] = useState<any>(null);
  const [showPastEvents, setShowPastEvents] = useState(false);

  // Simulamos que el músico logueado es "musician-123" (Acústico Sunset)
  const myEvents = events.filter(event => event.musicianId === "musician-123");
  
  // Filtrar según el toggle
  const visibleEvents = myEvents.filter(event => {
    if (showPastEvents) return true;
    return parseISO(event.date) >= new Date();
  });
  
  // Bolos confirmados (contamos solo los futuros o todos?)
  const confirmedGigsCount = myEvents.filter(e => parseISO(e.date) >= new Date()).length;

  return (
    <div className="flex flex-col gap-12">
      
      <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white mb-2">Bienvenido de nuevo</h1>
          <p className="text-white/50 text-xs uppercase tracking-widest">Resumen de tu actividad en Sona Empordà</p>
        </div>
        
        {/* Ultra-Compact Stats Header */}
        <div className="flex items-center gap-4 mt-2 md:mt-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/50 uppercase tracking-widest">Próximos confirmados:</span>
            <span className="text-sm font-bold text-white">{confirmedGigsCount}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_rgba(197,160,89,0.8)]"></div>
            <span className="text-[9px] text-gold uppercase tracking-widest font-bold">EPK 75%</span>
          </div>
        </div>
      </div>

      {/* Prominent SOS Urgent Banner */}
      <div 
        onClick={() => navigate('/musician/sos')}
        className="relative overflow-hidden border border-red-900/50 bg-gradient-to-r from-red-950/40 to-black p-6 md:p-8 cursor-pointer group rounded-xl shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-900/20 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-red-900/30 transition-colors"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-red-600 text-white px-2 py-1 text-[9px] uppercase tracking-widest font-bold animate-pulse rounded-sm">
                🚨 URGENCIA ALTA: HOY 22:00h
              </span>
            </div>
            <h2 className="text-2xl font-serif text-white">Sustituto de última hora requerido</h2>
            <p className="text-white/60 text-sm">Se busca DJ para sesión de tardeo electrónico en Sala Soho (Palamós). ¡Postúlate rápido!</p>
          </div>
          <button className="whitespace-nowrap bg-red-900 hover:bg-red-800 text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold transition-all hover:scale-105 rounded-sm">
            Ver Tablón SOS
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Next Gigs List (Prominent) */}
        <div>
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <h2 className="text-xl font-serif text-white">Tus eventos</h2>
            <button 
              onClick={() => setShowPastEvents(!showPastEvents)}
              className="flex items-center gap-2 text-white/50 hover:text-gold transition-colors text-lg"
              title={showPastEvents ? "Ocultar pasados" : "Ver pasados"}
            >
              {showPastEvents ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {visibleEvents.length === 0 && (
              <p className="text-white/40 text-sm italic">No hay eventos para mostrar.</p>
            )}
            
            {visibleEvents.map((event) => {
              const eventDate = parseISO(event.date);
              const isPast = eventDate < new Date();
              
              return (
                <div 
                  key={event.id} 
                  className={`bg-black border border-white/10 p-5 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 hover:border-gold/50 transition-colors group rounded-lg ${isPast ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-center gap-4 md:gap-5 cursor-pointer w-full sm:w-auto" onClick={() => navigate(`/event/${event.id}`)}>
                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-white/5 border border-white/10 rounded-sm group-hover:bg-gold group-hover:border-gold transition-all shrink-0 shadow-lg">
                      <span className="text-[9px] uppercase tracking-widest text-gold group-hover:text-black font-bold -mb-1">{format(eventDate, "MMM", { locale: es })}</span>
                      <span className="text-xl font-serif text-white group-hover:text-black leading-none mt-1">{format(eventDate, "dd")}</span>
                    </div>
                    <div className="flex flex-col gap-1 overflow-hidden min-w-0 w-full">
                      <p className="text-white text-base md:text-lg font-bold tracking-wide group-hover:text-gold transition-colors truncate">{event.title}</p>
                      <p className="text-white/50 text-[10px] uppercase tracking-widest flex items-center gap-2 truncate">
                        <FiClock className="w-3 h-3 text-gold shrink-0" /> {format(eventDate, "HH:mm")}h 
                        <span className="text-white/20">|</span> 
                        <FiMapPin className="w-3 h-3 text-gold shrink-0" /> <span className="truncate">{event.venueName}, {event.venueLocation}</span>
                      </p>
                    </div>
                  </div>
                  
                  {isPast ? (
                    <button 
                      onClick={() => {
                        setEventToEvaluate(event);
                        setIsRatingModalOpen(true);
                      }}
                      className="w-full sm:w-auto bg-gold text-black hover:bg-white px-5 py-3 text-[10px] uppercase tracking-widest font-bold transition-colors text-center rounded-sm"
                    >
                      Evaluar Local
                    </button>
                  ) : (
                    <span className="w-full sm:w-auto bg-green-900/30 text-green-500 border border-green-900 px-5 py-2 text-[10px] uppercase tracking-widest font-bold text-center rounded-sm flex items-center justify-center gap-2">
                      <FiCheckCircle className="w-4 h-4" /> Confirmado
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Modal Evaluación de Local */}
      {isRatingModalOpen && eventToEvaluate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-black border border-white/10 p-8 max-w-lg w-full flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-serif text-white mb-2">Evaluar Local</h2>
                <p className="text-white/50 text-xs uppercase tracking-widest">
                  Sala: {eventToEvaluate.venueName}
                </p>
              </div>

              <div className="flex flex-col gap-4 bg-white/5 p-4 border border-white/10">
                <p className="text-sm text-white/80 text-center">¿Cómo fue el trato y las condiciones de la sala?</p>
                <div className="flex justify-center gap-2 text-gold">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} className="hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 fill-current opacity-30 hover:opacity-100" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Comentarios para otros músicos</label>
                <textarea rows={3} placeholder="¿Qué tal el rider técnico, la acústica, el pago...?" className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none resize-none"></textarea>
              </div>

              <div className="flex gap-4 mt-2">
                <button onClick={() => setIsRatingModalOpen(false)} className="flex-1 border border-white/20 text-white/50 hover:text-white py-3 text-[10px] uppercase tracking-widest font-bold transition-colors">
                  Cancelar
                </button>
                <button onClick={() => setIsRatingModalOpen(false)} className="flex-1 bg-gold hover:bg-white text-black py-3 text-[10px] uppercase tracking-widest font-bold transition-colors">
                  Enviar Evaluación
                </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
