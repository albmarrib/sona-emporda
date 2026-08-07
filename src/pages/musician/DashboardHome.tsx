import { useState } from "react";
import { FiClock, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { mockEvents } from "../../data/mockEvents";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export const DashboardHome = () => {
  const navigate = useNavigate();
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [eventToEvaluate, setEventToEvaluate] = useState<any>(null);

  // Simulamos que el músico logueado es "musician-123" (Acústico Sunset)
  const myEvents = mockEvents.filter(event => event.musicianId === "musician-123");
  
  // Bolos confirmados
  const confirmedGigsCount = myEvents.length;

  return (
    <div className="flex flex-col gap-12">
      
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-serif text-white mb-2">Bienvenido de nuevo</h1>
        <p className="text-white/50 text-xs uppercase tracking-widest">Resumen de tu actividad en Sona Empordà</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-black border border-white/10 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 text-gold">
            <FiCheckCircle className="w-6 h-6" />
            <h3 className="text-[10px] uppercase tracking-widest font-bold">Bolos Confirmados</h3>
          </div>
          <p className="text-4xl font-serif text-white">{confirmedGigsCount}</p>
          <p className="text-xs text-white/40">Programados</p>
        </div>

        <div className="bg-black border border-white/10 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 text-gold">
            <FiClock className="w-6 h-6" />
            <h3 className="text-[10px] uppercase tracking-widest font-bold">Pendientes de Confirmar</h3>
          </div>
          <p className="text-4xl font-serif text-white">0</p>
          <p className="text-xs text-white/40">Revisa tu calendario</p>
        </div>

        <div className="bg-black border border-white/10 p-6 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex items-center gap-3 text-gold relative z-10">
            <FiAlertCircle className="w-6 h-6" />
            <h3 className="text-[10px] uppercase tracking-widest font-bold">Estado del EPK</h3>
          </div>
          <p className="text-4xl font-serif text-white relative z-10">75%</p>
          <p className="text-xs text-gold relative z-10">Añade tu Technical Rider</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Next Gigs List */}
        <div>
          <h2 className="text-xl font-serif text-white mb-6 border-b border-white/10 pb-4">Tus próximos eventos</h2>
          <div className="flex flex-col gap-4">
            {myEvents.length === 0 && (
              <p className="text-white/40 text-sm italic">No tienes eventos programados aún.</p>
            )}
            
            {myEvents.map((event) => {
              const eventDate = parseISO(event.date);
              const isPast = eventDate < new Date();
              
              return (
                <div 
                  key={event.id} 
                  className={`bg-black border border-white/10 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/5 transition-colors group ${isPast ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-center gap-6 cursor-pointer" onClick={() => navigate(`/event/${event.id}`)}>
                    <div className="text-center group-hover:text-gold transition-colors">
                      <p className="text-gold text-[10px] uppercase tracking-widest group-hover:text-white transition-colors">
                        {format(eventDate, "MMM", { locale: es })}
                      </p>
                      <p className="text-2xl font-serif text-white group-hover:text-gold transition-colors">
                        {format(eventDate, "dd")}
                      </p>
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold tracking-wide group-hover:text-gold transition-colors">{event.title}</p>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest">{event.venueName}</p>
                    </div>
                  </div>
                  
                  {isPast ? (
                    <button 
                      onClick={() => {
                        setEventToEvaluate(event);
                        setIsRatingModalOpen(true);
                      }}
                      className="w-full sm:w-auto bg-gold text-black hover:bg-white px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors text-center"
                    >
                      Evaluar Local
                    </button>
                  ) : (
                    <span className="w-full sm:w-auto bg-green-900/30 text-green-500 border border-green-900 px-3 py-1 text-[10px] uppercase tracking-widest text-center">
                      Confirmado
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SOS Board Teaser */}
        <div>
          <h2 className="text-xl font-serif text-white mb-6 border-b border-white/10 pb-4 flex items-center justify-between">
            <span>Urgencias en tu zona</span>
            <button onClick={() => navigate('/musician/sos')} className="text-gold text-[10px] uppercase tracking-widest cursor-pointer hover:text-white transition-colors">Ver Tablón SOS</button>
          </h2>
          <div className="bg-black border border-red-900/30 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-red-900 text-white px-2 py-1 text-[9px] uppercase tracking-widest font-bold animate-pulse">URGENTE: Hoy 22:00h</span>
            </div>
            <p className="text-white text-sm font-serif">Se busca DJ sustituto para sesión de tardeo electrónico.</p>
            <p className="text-white/40 text-[10px] uppercase tracking-widest">Sala Soho, Palamós</p>
            <button 
              onClick={() => navigate('/musician/sos')}
              className="mt-2 border border-gold text-gold hover:bg-gold hover:text-black py-2 text-[10px] uppercase tracking-widest font-bold transition-colors"
            >
              Postularse
            </button>
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
