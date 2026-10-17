import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "../../components/public/Header";
import { EventCard } from "../../components/public/EventCard";
import { EventCalendar } from "../../components/public/EventCalendar";
import { VenueList } from "../../components/public/VenueList";
import { LoadingScreen } from "../../components/shared/LoadingScreen";
import { InlineSearchBar } from "../../components/public/InlineSearchBar";
import { useEvents } from "../../hooks/useEvents";
import { useAuth } from "../../contexts/AuthContext";
import { InstallPWAModal } from "../../components/public/InstallPWAModal";
import { Info, Heart, Search, User, X } from "lucide-react";
import { FiAward } from "react-icons/fi";
import { useSettings } from "../../hooks/useSettings";
import { useFavorites } from "../../hooks/useFavorites";

type ViewMode = "LISTA" | "CALENDARIO" | "LUGARES";

export const Home = () => {
  const { events, loading: eventsLoading, error } = useEvents();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Filtros unificados en barra inline (la web de fondo permanece 100% visible)
  const [selectedVibe, setSelectedVibe] = useState<string>("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [selectedMusician, setSelectedMusician] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const [isStandalone, setIsStandalone] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const { settings, loading: settingsLoading } = useSettings();
  const VIBES = settings.vibes;
  
  const navigate = useNavigate();
  const { currentUser, userData, loading: authLoading } = useAuth();
  
  const viewParam = searchParams.get("view") as ViewMode;
  const activeView: ViewMode = ["LISTA", "CALENDARIO", "LUGARES"].includes(viewParam) ? viewParam : "LISTA";

  // Auto-abrir búsqueda si viene ?search=open (ej. desde el botón de la cabecera en otra página)
  useEffect(() => {
    if (searchParams.get("search") === "open") {
      setIsSearchOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("search");
      setSearchParams(next, { replace: true });
      setTimeout(() => {
        document.getElementById("search-panel")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    // Auto-redirect authenticated users to their dashboard on load
    if (!authLoading && currentUser && userData?.role) {
      navigate(`/${userData.role}`);
    }
  }, [currentUser, userData, authLoading, navigate]);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    setIsStandalone(standalone);
  }, []);

  const setActiveView = (view: ViewMode) => {
    setSearchParams({ view });
  };

  const [carouselIndex, setCarouselIndex] = useState(0);

  // Mostramos solo eventos confirmados, cancelados, o con músico asignado. Ocultamos los que buscan músico y los pasados.
  const confirmedEvents = events.filter(e => {
    const isPast = e.date ? new Date(e.date).getTime() < new Date().setHours(0,0,0,0) : false;
    if (isPast) return false;
    
    return e.status === 'confirmed' || 
           e.status === 'cancelled' || 
           e.status === 'musician_cancelled' || 
           (e.status === 'published' && e.musicianId);
  });
  
  // El carrusel rotará por todos los eventos disponibles, excluyendo los cancelados por el local
  const heroEvents = confirmedEvents.filter(e => e.status !== 'cancelled');

  // Extraer lista de músicos ordenada alfabéticamente
  const uniqueMusicians = useMemo(() => {
    const musicians = confirmedEvents
      .map(e => e.musicianName)
      .filter((name): name is string => typeof name === 'string' && name.trim().length > 0);
    return Array.from(new Set(musicians)).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [confirmedEvents]);

  // Contar filtros activos
  const activeFiltersCount =
    (selectedMusician ? 1 : 0) +
    (selectedVibe ? 1 : 0) +
    (showFavoritesOnly ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  // Botón "Todos": limpia todo y vuelve a mostrar toda la programación
  const handleResetAll = () => {
    setSelectedVibe("");
    setShowFavoritesOnly(false);
    setSelectedMusician(null);
    setSearchQuery("");
  };

  const handleToggleSearch = () => {
    const nextState = !isSearchOpen;
    setIsSearchOpen(nextState);
    if (nextState) {
      setTimeout(() => {
        document.getElementById("programacion")?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  };

  useEffect(() => {
    if (heroEvents.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % heroEvents.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroEvents.length]);

  if (eventsLoading || settingsLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <p className="text-red-900 border border-red-900 p-8 font-serif tracking-widest">{error}</p>
      </div>
    );
  }

  const currentHeroEvent = heroEvents[carouselIndex];
  
  // Filtrar eventos en tiempo real abajo en la lista
  const filteredEvents = confirmedEvents
    .filter(e => {
      // 1. Filtro Favoritos
      if (showFavoritesOnly && !isFavorite(e.id)) return false;
      // 2. Filtro Músico
      if (selectedMusician && e.musicianName !== selectedMusician) return false;
      // 3. Filtro Estilo / Tipo de evento
      if (selectedVibe && !(e.vibes || []).some((v: any) => v.toUpperCase().includes(selectedVibe.toUpperCase()))) {
        return false;
      }
      // 4. Búsqueda por texto (nombre de evento, local o músico)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (e.title || '').toLowerCase().includes(q);
        const matchMusician = (e.musicianName || '').toLowerCase().includes(q);
        const matchVenue = (e.venueName || '').toLowerCase().includes(q);
        const matchLocation = (e.venueLocation || e.location || '').toLowerCase().includes(q);
        if (!matchTitle && !matchMusician && !matchVenue && !matchLocation) return false;
      }
      return true;
    });

  return (
    <div className="min-h-screen bg-black text-white">
      <InstallPWAModal />
      
      {/* Header con botón Buscar integrado */}
      <Header 
        onOpenSearch={handleToggleSearch}
        activeFiltersCount={activeFiltersCount}
      />

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
                  
                  {/* Sponsor Tier 3 Overlay on Carousel */}
                  {event.sponsorTier === 3 && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent pt-8 pb-16 flex flex-col items-center gap-4 z-20">
                      <div className="flex items-center gap-3">
                        <FiAward className="w-8 h-8 text-gold animate-pulse" />
                        <span className="text-gold text-sm md:text-lg uppercase tracking-[0.5em] font-bold">Patrocinador Principal</span>
                        <FiAward className="w-8 h-8 text-gold animate-pulse" />
                      </div>
                      {event.sponsorImageUrl ? (
                        <img src={event.sponsorImageUrl} alt={event.sponsorName || 'Sponsor'} className="h-24 md:h-32 lg:h-40 object-contain drop-shadow-[0_0_30px_rgba(255,215,0,0.3)] brightness-200" />
                      ) : (
                        <span className="text-4xl md:text-6xl lg:text-7xl font-serif text-gold drop-shadow-[0_0_20px_rgba(255,215,0,0.5)] uppercase">{event.sponsorName}</span>
                      )}
                    </div>
                  )}

                  {/* Sponsor Tier 2 Overlay on Carousel */}
                  {event.sponsorTier === 2 && (
                    <div className="absolute top-6 right-6 md:top-10 md:right-10 bg-black/60 backdrop-blur-md border-2 border-gold/50 p-6 shadow-2xl z-20 flex flex-col items-end gap-3 rounded-lg">
                      <span className="text-gold text-xs uppercase tracking-[0.4em] font-bold">Patrocinador Oficial</span>
                      {event.sponsorImageUrl ? (
                        <img src={event.sponsorImageUrl} alt={event.sponsorName || 'Sponsor'} className="h-16 md:h-20 object-contain brightness-200" />
                      ) : (
                        <span className="text-2xl md:text-3xl font-serif text-white">{event.sponsorName}</span>
                      )}
                    </div>
                  )}

                  {/* Sponsor Tier 1 Overlay on Carousel */}
                  {event.sponsorTier === 1 && (
                    <div className="absolute top-6 right-6 md:top-10 md:right-10 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs md:text-sm uppercase tracking-widest px-6 py-3 shadow-2xl z-20">
                      Presentado por <span className="font-bold text-gold ml-2 text-base md:text-lg">{event.sponsorName}</span>
                    </div>
                  )}
                </div>
                
                <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 mt-16">
                  <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 border border-gold/50 px-4 py-2 flex items-center gap-2">
                    {event.sponsorTier && event.sponsorTier > 0 && <FiAward className="w-4 h-4" />}
                    {(event.sponsorTier && event.sponsorTier > 0) ? 'Patrocinado' : 'Destacado'}
                  </span>
                  <h2 className="text-4xl md:text-6xl font-serif text-white mb-4 max-w-4xl leading-tight drop-shadow-xl">
                    {event.title}
                  </h2>
                  <p className="text-white/60 text-xs md:text-sm uppercase tracking-widest mb-8 max-w-xl">
                    {event.venueName} — {event.venueLocation}
                  </p>
                  <div className="flex items-center gap-4">
                    <Link 
                      to={`/event/${event.id}`}
                      className="bg-gold text-black hover:bg-white hover:text-black transition-colors duration-500 px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-bold"
                    >
                      Descubrir Evento
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(event.id);
                      }}
                      className="p-3 border border-white/20 hover:bg-white/10 rounded-full transition-colors group/fav bg-black/30 backdrop-blur-sm"
                    >
                      <Heart 
                        className={`w-6 h-6 transition-colors ${
                          isFavorite(event.id) 
                            ? "fill-red-500 text-red-500" 
                            : "text-white/60 group-hover/fav:text-white"
                        }`} 
                      />
                    </button>
                  </div>
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
          
          <div id="programacion" className="flex flex-col gap-4 mb-8 border-b border-white/10 pb-6 scroll-mt-24">
            
            {/* Header de la sección */}
            <div className="flex flex-row items-center justify-between gap-4">
              {activeView === "LISTA" ? (
                <div className="flex items-baseline gap-3">
                  <h2 className="text-2xl md:text-4xl font-serif text-white">
                    Programación
                  </h2>
                  <span className="text-xs text-white/40 uppercase tracking-widest font-mono">
                    ({filteredEvents.length} {filteredEvents.length === 1 ? 'concierto' : 'conciertos'})
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => setActiveView("LISTA")}
                  className="flex items-center gap-2 text-gold hover:text-white transition-colors duration-300 text-[10px] uppercase tracking-widest font-bold"
                >
                  ← Volver a la Lista
                </button>
              )}
              
              {/* Botón Buscar / Filtrar que abre o cierra la barra inline */}
              <button
                onClick={handleToggleSearch}
                className={`flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition-all rounded-sm cursor-pointer ${
                  isSearchOpen || activeFiltersCount > 0 
                    ? 'bg-gold text-black font-bold shadow-md' 
                    : 'border border-white/20 text-white/80 hover:text-white hover:border-white/50 hover:bg-white/5'
                }`}
                title={isSearchOpen ? "Ocultar panel de búsqueda" : "Abrir buscador y filtros"}
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isSearchOpen ? 'Cerrar Buscador' : (activeFiltersCount > 0 ? `Filtros (${activeFiltersCount})` : 'Buscar')}
                </span>
                <span className="sm:hidden">
                  {isSearchOpen ? 'Cerrar' : (activeFiltersCount > 0 ? `(${activeFiltersCount})` : 'Buscar')}
                </span>
              </button>
            </div>

            {/* Barra de búsqueda y filtros inline: la web permanece visible y filtra en vivo */}
            <InlineSearchBar
              isOpen={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              musicians={uniqueMusicians}
              selectedMusician={selectedMusician}
              onSelectMusician={setSelectedMusician}
              vibes={VIBES}
              selectedVibe={selectedVibe}
              onSelectVibe={setSelectedVibe}
              showFavoritesOnly={showFavoritesOnly}
              onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
              onResetAll={handleResetAll}
              totalFilteredEvents={filteredEvents.length}
              totalConfirmedEvents={confirmedEvents.length}
            />

            {/* Badges de filtros activos si la barra está cerrada pero hay filtros */}
            {!isSearchOpen && activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1 animate-in fade-in duration-200">
                <span className="text-[10px] uppercase tracking-wider text-white/40 mr-1">Filtros activos:</span>
                
                {selectedMusician && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs text-white">
                    <User className="w-3 h-3 text-gold" />
                    <span>{selectedMusician}</span>
                    <button 
                      onClick={() => setSelectedMusician(null)} 
                      className="hover:text-red-400 ml-1"
                      title="Quitar artista"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedVibe && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold/10 border border-gold/30 rounded-full text-xs text-gold">
                    <span>{selectedVibe}</span>
                    <button 
                      onClick={() => setSelectedVibe("")}
                      className="hover:text-red-400 ml-1"
                      title="Quitar estilo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {showFavoritesOnly && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-xs text-red-400">
                    <Heart className="w-3 h-3 fill-red-400" />
                    <span>Favoritos</span>
                    <button 
                      onClick={() => setShowFavoritesOnly(false)}
                      className="hover:text-white ml-1"
                      title="Quitar filtro de favoritos"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs text-white">
                    <Search className="w-3 h-3 text-white/50" />
                    <span>"{searchQuery}"</span>
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="hover:text-red-400 ml-1"
                      title="Quitar término de búsqueda"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={handleResetAll}
                  className="text-[11px] text-white/40 hover:text-red-400 underline ml-2 transition-colors cursor-pointer"
                >
                  Todos (Limpiar)
                </button>
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
                <div className="text-center py-20 border border-white/5 space-y-3">
                  <p className="text-white/60 text-sm tracking-wide">
                    No se han encontrado conciertos con los filtros seleccionados.
                  </p>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={handleResetAll}
                      className="inline-block border border-gold text-gold hover:bg-gold hover:text-black transition-colors px-4 py-2 text-xs uppercase tracking-widest font-bold cursor-pointer"
                    >
                      Mostrar Todos los Conciertos
                    </button>
                  )}
                </div>
              )
            )}

            {activeView === "CALENDARIO" && (
              <EventCalendar 
                events={filteredEvents} 
                selectedVibes={selectedVibe ? [selectedVibe] : []}
                showFavorites={showFavoritesOnly}
                selectedMusician={selectedMusician}
              />
            )}

            {activeView === "LUGARES" && (
              <VenueList 
                events={confirmedEvents} 
                selectedVibes={selectedVibe ? [selectedVibe] : []}
                showFavorites={showFavoritesOnly}
                selectedMusician={selectedMusician}
              />
            )}
          </section>
        </div>
      </main>
      
      {/* Footer Minimalista con Identidad de Marca */}
      <footer className="border-t border-white/10 py-12 text-center mt-20 relative">
        <div className="text-2xl mb-4 font-sans font-bold tracking-widest select-none">
          <span className="text-white">SONA</span><span className="text-gold font-serif font-normal">Empordà</span>
        </div>
        <p className="text-white/30 text-[10px] uppercase tracking-widest mb-6">
          © {new Date().getFullYear()} Todos los derechos reservados.
        </p>
        {!isStandalone && (
          <button 
            onClick={() => window.dispatchEvent(new Event('open-pwa-modal'))}
            className="inline-flex items-center gap-2 text-white/50 hover:text-gold transition-colors text-xs"
            title="Instalar App"
          >
            <Info size={16} />
            <span>Instalar App</span>
          </button>
        )}
      </footer>
    </div>
  );
};
