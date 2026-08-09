import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Header } from "../../components/public/Header";
import { EventCard } from "../../components/public/EventCard";
import { EventCalendar } from "../../components/public/EventCalendar";
import { VenueList } from "../../components/public/VenueList";
import { LoadingScreen } from "../../components/shared/LoadingScreen";
import { useEvents } from "../../hooks/useEvents";

// VIBES purificados sin emojis para estilo premium
const VIBES = ["BAILAR", "TARDEO", "ACÚSTICO", "ELECTRÓNICA", "CENA"];
type ViewMode = "LISTA" | "CALENDARIO" | "LUGARES";

export const Home = () => {
  const { events, loading, error } = useEvents();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const viewParam = searchParams.get("view") as ViewMode;
  const activeView: ViewMode = ["LISTA", "CALENDARIO", "LUGARES"].includes(viewParam) ? viewParam : "LISTA";

  const setActiveView = (view: ViewMode) => {
    setSearchParams({ view });
  };

  const [carouselIndex, setCarouselIndex] = useState(0);

  // El carrusel rotará por todos los eventos disponibles
  const heroEvents = events;

  useEffect(() => {
    if (heroEvents.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % heroEvents.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroEvents.length]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <p className="text-red-900 border border-red-900 p-8 font-serif tracking-widest">{error}</p>
      </div>
    );
  }

  // El código de los hooks de carouselIndex fue movido arriba

  const currentHeroEvent = heroEvents[carouselIndex];
  
  // Filtrar el resto de eventos para la lista
  const filteredEvents = events
    .filter(e => e.id !== currentHeroEvent?.id)
    .filter(e => {
      if (selectedVibes.length === 0) return true;
      return (e.vibes || []).some((v: any) => selectedVibes.some(selected => v.toUpperCase().includes(selected)));
    });

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main>
        {/* Hero Event Carousel (Destacado) */}
        {currentHeroEvent && activeView === "LISTA" && heroEvents.length > 0 && (
          <section className="relative h-[70vh] min-h-[500px] w-full border-b border-white/10 overflow-hidden">
            {heroEvents.map((event, index) => (
              <div 
                key={event.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === carouselIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <div className="absolute inset-0">
                  <img 
                    src={event.imageUrl} 
                    alt={event.title} 
                    className={`w-full h-full object-cover opacity-60 grayscale transition-transform duration-[6000ms] ${index === carouselIndex ? 'scale-105' : 'scale-100'}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>
                
                <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 mt-16">
                  <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 border border-gold/50 px-4 py-2">
                    Destacado
                  </span>
                  <h2 className="text-4xl md:text-6xl font-serif text-white mb-4 max-w-4xl leading-tight drop-shadow-xl">
                    {event.title}
                  </h2>
                  <p className="text-white/60 text-xs md:text-sm uppercase tracking-widest mb-8 max-w-xl">
                    {event.venueName} — {event.venueLocation}
                  </p>
                  <Link 
                    to={`/event/${event.id}`}
                    className="bg-gold text-black hover:bg-white hover:text-black transition-colors duration-500 px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-bold"
                  >
                    Descubrir Evento
                  </Link>
                </div>
              </div>
            ))}
            
            {/* Carousel Indicators */}
            {heroEvents.length > 1 && (
              <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-3">
                {heroEvents.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCarouselIndex(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${idx === carouselIndex ? 'w-6 bg-gold' : 'bg-white/30 hover:bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-12">
          
          <div className="flex flex-col gap-6 mb-8 border-b border-white/10 pb-6">
            
            {/* Header de la sección */}
            <div className="flex flex-row items-center justify-between gap-6 relative">
              {activeView === "LISTA" ? (
                <h2 className="text-2xl md:text-4xl font-serif text-white">
                  Programación
                </h2>
              ) : (
                <button
                  onClick={() => setActiveView("LISTA")}
                  className="flex items-center gap-2 text-gold hover:text-white transition-colors duration-300 text-[10px] uppercase tracking-widest font-bold"
                >
                  ← Volver a la Lista
                </button>
              )}
              
              {/* Botón de Filtros Unificado */}
              <button
                onClick={() => setIsFilterOpen(true)}
                className={`flex items-center gap-3 px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] transition-all duration-500 ${
                  selectedVibes.length > 0
                    ? "bg-gold text-black shadow-[0_0_15px_rgba(197,160,89,0.3)]" 
                    : "border border-white/20 text-white hover:border-white/60 hover:bg-white/5"
                }`}
              >
                <span className={selectedVibes.length > 0 ? "font-bold" : ""}>
                  Filtros {selectedVibes.length > 0 && `(${selectedVibes.length})`}
                </span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>

              {/* Panel Desplegable de Filtros Premium (Dropdown Compacto) */}
              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-[#0a0a0a] border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 w-48 rounded-sm">
                  <div className="flex flex-col py-2">
                    <button
                      onClick={() => setSelectedVibes([])}
                      className="flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors group"
                    >
                      <div className={`w-3 h-3 rounded-sm flex-shrink-0 border flex items-center justify-center transition-all ${selectedVibes.length === 0 ? "border-gold bg-gold" : "border-white/20 group-hover:border-white/40"}`}>
                        {selectedVibes.length === 0 && <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className={`text-[10px] uppercase tracking-widest transition-colors ${selectedVibes.length === 0 ? "text-gold font-bold" : "text-white/60 group-hover:text-white"}`}>
                        Todos
                      </span>
                    </button>
                    
                    {VIBES.map(vibe => {
                      const isSelected = selectedVibes.includes(vibe);
                      return (
                        <button
                          key={vibe}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedVibes(selectedVibes.filter(v => v !== vibe));
                            } else {
                              setSelectedVibes([...selectedVibes, vibe]);
                            }
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors group"
                        >
                          <div className={`w-3 h-3 rounded-sm flex-shrink-0 border flex items-center justify-center transition-all duration-300 ${isSelected ? "border-gold bg-gold" : "border-white/20 group-hover:border-white/40"}`}>
                            {isSelected && (
                              <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-[10px] uppercase tracking-widest transition-colors ${isSelected ? "text-white font-bold" : "text-white/60 group-hover:text-white"}`}>
                            {vibe}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="p-2 border-t border-white/5 bg-black/40">
                    <button 
                      onClick={() => setIsFilterOpen(false)}
                      className="w-full bg-gold text-black text-[9px] uppercase tracking-[0.2em] font-bold py-2.5 rounded-sm hover:bg-white hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-300"
                    >
                      Aplicar Filtros
                    </button>
                  </div>
                </div>
              )}
            </div>
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
              <EventCalendar events={events} selectedVibes={selectedVibes} />
            )}

            {activeView === "LUGARES" && (
              <VenueList events={events} selectedVibes={selectedVibes} />
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
