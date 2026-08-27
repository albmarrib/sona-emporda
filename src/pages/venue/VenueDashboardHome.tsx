import { FiUsers, FiCalendar, FiArrowRight, FiSearch, FiAlertTriangle } from "react-icons/fi";
import { useEvents } from "../../hooks/useEvents";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useChat } from "../../hooks/useChat";
import { doc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useSosAlerts } from "../../hooks/useSosAlerts";

export const VenueDashboardHome = () => {
  const navigate = useNavigate();
  const { events } = useEvents(true);
  const { userData, currentUser } = useAuth();
  const venueName = userData?.name || 'Sala Soho';
  const venueId = currentUser?.uid;
  const { findOrCreateChat, sendMessage } = useChat();
  const { activeSosCount, activeCollabCount } = useSosAlerts();
  
  const upcomingEvents = events
    .filter(e => (e.venueId && e.venueId === venueId) || (e.venueName && e.venueName === venueName))
    .filter(e => e.status !== 'cancelled')
    .filter(e => parseISO(e.date) >= new Date())
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
    .slice(0, 3);
  
  return (
    <div className="flex flex-col gap-12">
      
      <div className="border-b border-white/10 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center justify-between w-full md:w-auto">
          <h1 className="text-xl md:text-2xl font-serif text-white uppercase tracking-widest truncate">{venueName}</h1>
        </div>
        
        {/* Ultra-Compact Stats Header */}
        <div className="flex items-center gap-6 mt-2 md:mt-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/50 uppercase tracking-widest">Próximos eventos:</span>
            <span className="text-sm font-bold text-white">{upcomingEvents.length}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 border border-white/10 cursor-pointer hover:border-gold/50 transition-colors" onClick={() => navigate('/venue/search')}>
            <FiUsers className="w-3 h-3 text-gold" />
            <span className="text-[9px] text-white uppercase tracking-widest font-bold">Ver Artistas</span>
          </div>
        </div>
      </div>

      {/* Prominent Event Creation Banner */}
      <div 
        onClick={() => navigate('/venue/events')}
        className="relative overflow-hidden border border-gold/30 bg-gradient-to-r from-gold/10 to-black p-6 md:p-8 cursor-pointer group shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-gold/10 transition-colors"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-serif text-white group-hover:text-gold transition-colors">¿Nuevas fechas confirmadas?</h2>
            <p className="text-white/60 text-sm">Organiza tu calendario, añade etiquetas de estilo y haz público tu próximo evento.</p>
          </div>
          <button className="whitespace-nowrap bg-gold text-black px-6 py-3 text-[10px] uppercase tracking-widest font-bold transition-all hover:bg-white rounded-sm flex items-center gap-2">
            <FiCalendar className="w-4 h-4" /> Programar Evento
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-12">
        {/* Simple Alert Notice */}
        {(activeSosCount > 0 || activeCollabCount > 0) && (
          <div className="w-full bg-zinc-900 border border-white/10 p-4 shadow-lg rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer hover:bg-zinc-800 transition-colors mb-6 gap-4" onClick={() => navigate('/venue/sos')}>
            <div className="flex items-center gap-3">
              <FiAlertTriangle className={`w-6 h-6 shrink-0 ${activeSosCount > 0 ? 'text-red-500 animate-pulse' : 'text-green-500'}`} />
              <div>
                <p className="text-white font-serif text-lg">Nuevos avisos en el Tablón SOS</p>
                <p className="text-white/50 text-xs">
                  {activeSosCount > 0 && <span className="text-red-400 font-bold">{activeSosCount} urgentes</span>}
                  {activeSosCount > 0 && activeCollabCount > 0 && <span className="mx-2">|</span>}
                  {activeCollabCount > 0 && <span className="text-green-400 font-bold">{activeCollabCount} colaboraciones</span>}
                </p>
              </div>
            </div>
            <button className="whitespace-nowrap bg-white/10 hover:bg-gold hover:text-black text-white px-4 py-2 text-xs uppercase tracking-widest font-bold transition-colors rounded-sm">
              Revisar
            </button>
          </div>
        )}
        {/* Next Gigs List (Prominent) */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
            <h2 className="text-xl font-serif text-white">Tu programación</h2>
            <button onClick={() => navigate('/venue/events')} className="text-gold text-[10px] uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">Ver toda <FiArrowRight /></button>
          </div>
          <div className="flex flex-col gap-4">
            {upcomingEvents.map((event) => {
              const eventDate = parseISO(event.date);
              
              return (
                <div 
                  key={event.id} 
                  className="bg-black border border-white/10 p-5 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 hover:border-gold/50 transition-colors group"
                >
                  <div className="flex items-center gap-4 md:gap-5 cursor-pointer w-full sm:w-auto" onClick={() => navigate(`/event/${event.id}`)}>
                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-white/5 border border-white/10 group-hover:bg-gold group-hover:border-gold transition-all shrink-0 shadow-lg">
                      <span className="text-[9px] uppercase tracking-widest text-gold group-hover:text-black font-bold -mb-1">{format(eventDate, "MMM", { locale: es })}</span>
                      <span className="text-xl font-serif text-white group-hover:text-black leading-none mt-1">{format(eventDate, "dd")}</span>
                    </div>
                    
                    <div className="w-10 h-10 overflow-hidden shrink-0 border border-white/10 hidden sm:block">
                      <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="flex flex-col gap-1 overflow-hidden min-w-0 w-full">
                      <p className="text-white text-base md:text-lg font-bold tracking-wide group-hover:text-gold transition-colors truncate">{event.title}</p>
                      <p className="text-white/50 text-[10px] uppercase tracking-widest flex items-center gap-2 truncate">
                         {format(eventDate, "HH:mm")}h 
                        <span className="text-white/20">|</span> 
                         <span className="truncate">{event.ticketType}</span>
                      </p>
                    </div>
                  </div>
                  
                  <span className={`w-full sm:w-auto px-5 py-2 text-[10px] uppercase tracking-widest font-bold text-center flex items-center justify-center gap-2 shrink-0 ${
                    event.status === 'published' ? 'bg-green-900/30 text-green-500 border border-green-900' :
                    event.status === 'rejected' ? 'bg-red-900/30 text-red-500 border border-red-900' :
                    event.status === 'pending_musician' ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-900' :
                    event.status === 'musician_accepted' ? 'bg-blue-900/30 text-blue-400 border border-blue-900' :
                    event.status === 'musician_cancelled' ? 'bg-red-900 text-white border border-red-500 animate-pulse' :
                    event.status === 'cancelled' ? 'bg-red-900/50 text-white/50 border border-red-900' :
                    'bg-green-900 text-white border border-green-700'
                  }`}>
                    {
                      event.status === 'published' ? 'Buscando Grupo' :
                      event.status === 'rejected' ? 'Rechazado' :
                      event.status === 'pending_musician' ? 'Esperando Respuesta' :
                      event.status === 'musician_accepted' ? 'Músico Interesado' :
                      event.status === 'musician_cancelled' ? '¡MÚSICO CANCELÓ!' :
                      event.status === 'cancelled' ? 'Cancelado' :
                      'Confirmado'
                    }
                  </span>
                  <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    {(event.status === 'confirmed' || (event.status === 'published' && event.musicianId)) && (
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm('¿Quieres cancelar este bolo? El músico recibirá un aviso automático y el evento volverá a buscar artistas.')) return;
                          
                          try {
                            const musicianIdToNotify = event.musicianId;
                            
                            await updateDoc(doc(db, 'events', event.id), {
                              status: 'published',
                              musicianId: null,
                              musicianName: null,
                              applicants: arrayRemove(musicianIdToNotify)
                            });

                            if (musicianIdToNotify) {
                              const chatId = await findOrCreateChat(musicianIdToNotify, event.id);
                              const cancelMsg = `Hola, lamentamos informarte que hemos tenido que cancelar tu actuación para el evento "${event.title}" del ${format(eventDate, "d 'de' MMMM", { locale: es })}.`;
                              await sendMessage(chatId, cancelMsg);
                            }
                          } catch (err) {
                            console.error(err);
                            alert("Error al cancelar el evento.");
                          }
                        }}
                        className="w-full sm:w-auto px-4 py-2 border border-red-500/50 bg-red-900/30 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-[10px] uppercase tracking-widest font-bold"
                      >
                        Cancelar Bolo
                      </button>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate('/venue/events'); }}
                      className="w-full sm:w-auto px-4 py-2 border border-white/20 text-white/50 hover:border-gold hover:text-gold transition-colors text-[10px] uppercase tracking-widest font-bold"
                    >
                      Editar/Borrar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Creador Rápido / Agente Booking */}
        <div className="w-full md:w-80 shrink-0">
           <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <h2 className="text-xl font-serif text-white">Booking IA</h2>
          </div>
          <div className="bg-black border border-white/10 p-8 flex flex-col items-center justify-center text-center gap-6 h-auto min-h-[300px]">
             <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                <FiSearch className="w-8 h-8 text-gold" />
             </div>
             <div>
               <h3 className="text-lg font-serif text-white mb-2">¿Buscas músicos?</h3>
               <p className="text-white/50 text-xs max-w-sm mx-auto leading-relaxed">
                 Describe qué necesitas y nuestro Agente IA te encontrará las mejores opciones disponibles.
               </p>
             </div>
             <button 
                onClick={() => navigate('/venue/search')}
                className="w-full bg-gold text-black font-bold text-[10px] uppercase tracking-widest py-4 hover:bg-white transition-colors mt-2"
             >
                Iniciar Búsqueda
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
