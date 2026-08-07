import { FiAlertTriangle, FiUsers, FiCalendar, FiArrowRight, FiSearch } from "react-icons/fi";
import { mockEvents } from "../../data/mockEvents";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export const VenueDashboardHome = () => {
  const navigate = useNavigate();
  
  // Simulamos que somos el local "Sala Soho" (o cualquier otro)
  // Para la demo, simplemente mostraremos todos los eventos (o los primeros 3)
  const upcomingEvents = mockEvents.slice(0, 3);
  
  return (
    <div className="flex flex-col gap-12">
      
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-serif text-white mb-2">Bienvenido, Sala Soho</h1>
        <p className="text-white/50 text-xs uppercase tracking-widest">Resumen de tu actividad y programación musical</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-zinc-950 border border-white/10 p-6 flex flex-col gap-4 hover:border-gold/30 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-gold">
              <FiCalendar className="w-6 h-6" />
              <h3 className="text-[10px] uppercase tracking-widest font-bold">Eventos este mes</h3>
            </div>
            <button onClick={() => navigate('/venue/events')} className="text-white/40 hover:text-white"><FiArrowRight /></button>
          </div>
          <p className="text-4xl font-serif text-white">4</p>
          <p className="text-xs text-white/40">2 confirmados, 2 pendientes</p>
        </div>

        <div className="bg-zinc-950 border border-white/10 p-6 flex flex-col gap-4 hover:border-gold/30 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-gold">
              <FiUsers className="w-6 h-6" />
              <h3 className="text-[10px] uppercase tracking-widest font-bold">Nuevos Artistas</h3>
            </div>
            <button onClick={() => navigate('/venue/search')} className="text-white/40 hover:text-white"><FiArrowRight /></button>
          </div>
          <p className="text-4xl font-serif text-white">12</p>
          <p className="text-xs text-white/40">Nuevos perfiles en tu zona esta semana</p>
        </div>

        <div className="bg-red-950/20 border border-red-900/50 p-6 flex flex-col gap-4 relative overflow-hidden group cursor-pointer" onClick={() => navigate('/venue/sos')}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-red-500/20 transition-colors"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3 text-red-500">
              <FiAlertTriangle className="w-6 h-6" />
              <h3 className="text-[10px] uppercase tracking-widest font-bold">Red SOS</h3>
            </div>
            <FiArrowRight className="text-red-500 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-4xl font-serif text-white relative z-10">1</p>
          <p className="text-xs text-red-400 relative z-10">Urgencia activa en tu área</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Next Gigs List */}
        <div>
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <h2 className="text-xl font-serif text-white">Tu programación</h2>
            <button onClick={() => navigate('/venue/events')} className="text-gold text-[10px] uppercase tracking-widest hover:text-white transition-colors">Ver toda</button>
          </div>
          
          <div className="flex flex-col gap-4">
            {upcomingEvents.map((event) => {
              const eventDate = parseISO(event.date);
              
              return (
                <div 
                  key={event.id} 
                  onClick={() => navigate(`/event/${event.id}`)}
                  className="bg-zinc-950 border border-white/10 p-4 flex justify-between items-center hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-6">
                    <div className="text-center group-hover:text-gold transition-colors w-12">
                      <p className="text-gold text-[10px] uppercase tracking-widest group-hover:text-white transition-colors">
                        {format(eventDate, "MMM", { locale: es })}
                      </p>
                      <p className="text-2xl font-serif text-white group-hover:text-gold transition-colors">
                        {format(eventDate, "dd")}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5">
                      <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold tracking-wide group-hover:text-gold transition-colors">{event.title}</p>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest">
                        {format(eventDate, "HH:mm")}h • {event.ticketType}
                      </p>
                    </div>
                  </div>
                  <span className="hidden md:inline-flex bg-green-900/30 text-green-500 border border-green-900 px-3 py-1 text-[10px] uppercase tracking-widest">
                    Confirmado
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Creador Rápido / Agente Booking */}
        <div>
           <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <h2 className="text-xl font-serif text-white">Booking IA</h2>
          </div>
          <div className="bg-zinc-950 border border-white/10 p-8 flex flex-col items-center justify-center text-center gap-6 h-[300px]">
             <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                <FiSearch className="w-8 h-8 text-gold" />
             </div>
             <div>
               <h3 className="text-lg font-serif text-white mb-2">¿Buscas músicos?</h3>
               <p className="text-white/50 text-sm max-w-sm mx-auto">
                 Describe qué necesitas y nuestro Agente IA te encontrará las mejores opciones disponibles en tu zona.
               </p>
             </div>
             <button 
                onClick={() => navigate('/venue/search')}
                className="bg-gold text-black font-bold text-xs uppercase tracking-widest px-8 py-3 hover:bg-white transition-colors"
             >
                Iniciar Búsqueda
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
