import { useParams, useNavigate } from "react-router-dom";
import { Header } from "../../components/public/Header";
import { useEvents } from "../../hooks/useEvents";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { FiArrowLeft, FiMapPin, FiCalendar, FiClock } from "react-icons/fi";

export const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, loading, error } = useEvents();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gold font-serif text-2xl tracking-widest animate-pulse">
          Cargando Evento...
        </div>
      </div>
    );
  }

  const event = events.find(e => e.id === id);

  if (!event || error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <p className="text-red-900 border border-red-900 p-8 font-serif tracking-widest mb-6">
          Evento no encontrado
        </p>
        <button 
          onClick={() => navigate(-1)}
          className="text-gold text-xs uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2"
        >
          <FiArrowLeft /> Volver
        </button>
      </div>
    );
  }

  const dateObj = event.date ? parseISO(event.date) : new Date();
  if (isNaN(dateObj.getTime())) return <div className="text-white text-center p-20">Error: Fecha de evento inválida</div>;

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="max-w-5xl mx-auto pb-24">
        {/* Navigation */}
        <div className="px-6 py-8">
          <button 
            onClick={() => navigate(-1)}
            className="text-white/50 hover:text-gold text-xs uppercase tracking-[0.2em] transition-colors flex items-center gap-3"
          >
            <FiArrowLeft className="w-4 h-4" /> Volver atrás
          </button>
        </div>

        {/* Hero Image */}
        <div className="px-6 mb-12">
          <div className="w-full h-[50vh] min-h-[400px] relative overflow-hidden border border-white/10">
            <img 
              src={event.imageUrl} 
              alt={event.title}
              className="w-full h-full object-cover grayscale opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            
            {event.isSponsored && (
              <div className="absolute top-6 right-6 bg-gold text-black text-[10px] uppercase tracking-widest px-4 py-2 font-bold shadow-2xl">
                Presentado por {event.sponsorName}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Main Info */}
          <div className="md:col-span-2">
            <div className="flex flex-wrap gap-3 mb-6">
              {event.vibes?.map((vibe: any) => (
                <span key={vibe} className="text-white/40 text-[10px] uppercase tracking-[0.2em] border border-white/10 px-3 py-1">
                  {vibe.replace(/[^\w\s]/gi, '')}
                </span>
              ))}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-serif leading-tight mb-8">
              {event.title}
            </h1>

            <div className="w-16 h-px bg-gold mb-8" />

            <div className="prose prose-invert prose-p:font-light prose-p:text-white/70 prose-p:leading-relaxed max-w-none">
              <p>
                Disfruta de una experiencia inolvidable en el corazón del Empordà. 
                Este evento reúne lo mejor de la música en vivo con el ambiente exclusivo que caracteriza a nuestros locales asociados.
                Una noche diseñada para dejarse llevar por los sentidos, la buena compañía y la magia del entorno.
              </p>
              <p>
                Las plazas son muy limitadas para garantizar la mejor experiencia. 
                Asegura tu asistencia cuanto antes.
              </p>
            </div>
          </div>

          {/* Sidebar / CTA */}
          <div className="md:col-span-1">
            <div className="bg-white/5 border border-white/10 p-8 sticky top-32">
              <h3 className="text-xl font-serif text-white mb-6 border-b border-white/10 pb-4">Detalles</h3>
              
              <div className="flex flex-col gap-6 mb-8 text-sm">
                <div className="flex items-start gap-4 text-white/70">
                  <FiCalendar className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="font-serif text-white text-lg capitalize">{format(dateObj, "EEEE, d 'de' MMMM", { locale: es })}</p>
                    <p className="text-xs uppercase tracking-widest mt-1">2026</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 text-white/70">
                  <FiClock className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="font-serif text-white text-lg">{format(dateObj, "HH:mm")}h</p>
                    <p className="text-xs uppercase tracking-widest mt-1">Apertura de puertas</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 text-white/70">
                  <FiMapPin className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="font-serif text-white text-lg">{event.venueName}</p>
                    <p className="text-xs uppercase tracking-widest mt-1">{event.venueLocation}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
                <div className="text-center">
                  <span className="text-white/50 text-[10px] uppercase tracking-widest block mb-2">Acceso</span>
                  <span className="font-serif text-xl text-white">{event.ticketType}</span>
                </div>
                <button className="w-full bg-gold text-black text-xs uppercase tracking-widest font-bold py-4 hover:bg-white transition-colors duration-300">
                  {event.ticketType === "Comprar Entrada" ? "Comprar Entradas" : "Reservar Ahora"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
