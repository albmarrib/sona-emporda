import { useState } from "react";
import { Header } from "../../components/public/Header";
import { EventCard } from "../../components/public/EventCard";
import { EventCalendar } from "../../components/public/EventCalendar";
import { VenueList } from "../../components/public/VenueList";
import { useEvents } from "../../hooks/useEvents";

// VIBES purificados sin emojis para estilo premium
const VIBES = ["TODOS", "BAILAR", "TARDEO", "ACÚSTICO", "ELECTRÓNICA", "CENA"];
type ViewMode = "LISTA" | "CALENDARIO" | "LUGARES";

export const Home = () => {
  const { events, loading, error } = useEvents();
  const [activeVibe, setActiveVibe] = useState("TODOS");
  const [activeView, setActiveView] = useState<ViewMode>("LISTA");

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gold font-serif text-2xl tracking-widest animate-pulse">
          SONA<span className="">Empordà</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <p className="text-red-900 border border-red-900 p-8 font-serif tracking-widest">{error}</p>
      </div>
    );
  }

  // Separar hero event (podría ser el primero patrocinado o simplemente el primero)
  const heroEvent = events.find(e => e.isSponsored) || events[0];
  
  // Filtrar el resto de eventos para la lista
  const filteredEvents = events
    .filter(e => e.id !== heroEvent?.id)
    .filter(e => {
      if (activeVibe === "TODOS") return true;
      return e.vibes.some(v => v.toUpperCase().includes(activeVibe));
    });

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main>
        {/* Hero Event (Destacado) */}
        {heroEvent && activeView === "LISTA" && activeVibe === "TODOS" && (
          <section className="relative h-[70vh] min-h-[500px] w-full border-b border-white/10">
            <div className="absolute inset-0">
              <img 
                src={heroEvent.imageUrl} 
                alt={heroEvent.title} 
                className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>
            
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 mt-16">
              <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 border border-gold/50 px-4 py-2">
                Concierto Inaugural
              </span>
              <h2 className="text-4xl md:text-6xl font-serif text-white mb-4 max-w-4xl leading-tight">
                {heroEvent.title}
              </h2>
              <p className="text-white/60 text-xs md:text-sm uppercase tracking-widest mb-8 max-w-xl">
                {heroEvent.venueName} — {heroEvent.venueLocation}
              </p>
              <button className="bg-gold text-black hover:bg-white hover:text-black transition-colors duration-500 px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-bold">
                Descubrir Evento
              </button>
            </div>
          </section>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          
          <div className="flex flex-col gap-10 mb-12 border-b border-white/10 pb-6">
            
            {/* View Navigation Tabs */}
            <div className="flex justify-center md:justify-start gap-8 border-b border-white/5 pb-4">
              {(["LISTA", "CALENDARIO", "LUGARES"] as ViewMode[]).map((view) => (
                <button
                  key={view}
                  onClick={() => setActiveView(view)}
                  className={`text-sm md:text-base font-serif tracking-[0.2em] transition-colors duration-300 ${
                    activeView === view 
                      ? "text-gold" 
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>

            {/* Title & Vibes (Only for Lista) */}
            {activeView === "LISTA" && (
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <h2 className="text-2xl md:text-4xl font-serif text-white hidden md:block">
                  Programación
                </h2>
                
                {/* Minimalist Filters */}
                <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
                  {VIBES.map(vibe => (
                    <button
                      key={vibe}
                      onClick={() => setActiveVibe(vibe)}
                      className={`text-[10px] uppercase tracking-[0.2em] whitespace-nowrap transition-colors duration-300 ${
                        activeVibe === vibe 
                          ? "text-gold border-b border-gold pb-1" 
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      {vibe}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Main Content Area based on View */}
          <section className="min-h-[40vh]">
            {activeView === "LISTA" && (
              filteredEvents.length > 0 ? (
                <div className="flex flex-col">
                  {filteredEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border border-white/5">
                  <p className="text-white/40 text-xs uppercase tracking-widest">
                    No hay eventos programados en esta categoría.
                  </p>
                </div>
              )
            )}

            {activeView === "CALENDARIO" && (
              <EventCalendar events={events} />
            )}

            {activeView === "LUGARES" && (
              <VenueList events={events} />
            )}
          </section>
        </div>
      </main>
      
      {/* Footer Minimalista */}
      <footer className="border-t border-white/10 py-12 text-center mt-20">
        <div className="text-gold font-serif text-2xl mb-4">Sona Empordà</div>
        <p className="text-white/30 text-[10px] uppercase tracking-widest">
          © {new Date().getFullYear()} Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
};
