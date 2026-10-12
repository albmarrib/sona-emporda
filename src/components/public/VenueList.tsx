import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { addDays, isWithinInterval, parseISO, format, startOfDay, endOfDay, endOfMonth, nextSaturday, nextSunday } from "date-fns";
import { es } from "date-fns/locale";
import { Heart, Calendar, MapPin, Navigation } from "lucide-react";
import { useFavorites } from "../../hooks/useFavorites";
import type { SonaEvent } from "../../types";

// Fix Leaflet default icon issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom Icon for User Position (Gold Pulse) - using tailwind logic directly but forcing transparent background to override leaflet styles
const userIcon = new L.DivIcon({
  html: `<div class="relative w-6 h-6">
           <div class="absolute inset-0 bg-[#C5A059] rounded-full animate-ping opacity-75"></div>
           <div class="relative w-6 h-6 bg-[#C5A059] rounded-full border-2 border-white shadow-[0_0_15px_#C5A059]"></div>
         </div>`,
  className: "bg-transparent border-0", // Tailwind utilities to remove Leaflet's default white box
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface VenueMapProps {
  events: SonaEvent[];
  selectedVibes: string[];
  showFavorites?: boolean;
  selectedMusician?: string | null;
}

const DEFAULT_CENTER: [number, number] = [41.85, 3.10]; 

const MapUpdater = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 12, { animate: true });
    }
  }, [center, map]);
  return null;
};

export const VenueList = ({ events, selectedVibes, showFavorites = false, selectedMusician = null }: VenueMapProps) => {
  const navigate = useNavigate();
  const today = new Date();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  
  const { isFavorite } = useFavorites();
  
  // Date filters
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDays(today, 7));

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLocating(false);
        },
        () => {
          setUserLocation(DEFAULT_CENTER);
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setUserLocation(DEFAULT_CENTER);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const filteredEvents = events.filter(event => {
    if (!event.date || event.status === 'cancelled' || event.status === 'musician_cancelled') return false;
    const eventDate = parseISO(event.date);
    if (isNaN(eventDate.getTime())) return false;
    const matchesDate = isWithinInterval(eventDate, { start: startOfDay(startDate), end: endOfDay(endDate) });
    const matchesVibe = selectedVibes.length === 0 || (event.vibes || []).some(v => selectedVibes.some(selected => v.toUpperCase().includes(selected)));
    const matchesFavorite = showFavorites ? isFavorite(event.id) : true;
    const matchesMusician = selectedMusician ? event.musicianName === selectedMusician : true;
    return matchesDate && matchesVibe && matchesFavorite && matchesMusician;
  });

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    if(!event.coordinates) return acc;
    const key = `${event.coordinates.lat},${event.coordinates.lng}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {} as Record<string, typeof filteredEvents>);

  const mapCenter = userLocation || DEFAULT_CENTER;

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-12 relative">
      {/* Controles de fecha superiores destacados */}
      <div className="bg-black/90 border border-gold/30 p-4 md:p-5 shadow-2xl backdrop-blur-md rounded-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gold/10 border border-gold/30 text-gold rounded-sm shrink-0">
              <Calendar className="w-5 h-5 text-gold" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-white font-serif text-base tracking-wide uppercase font-semibold m-0">
                  Filtrar por Rango de Fechas
                </h3>
                <span className="text-[10px] bg-gold/20 text-gold border border-gold/40 px-2 py-0.5 rounded-full font-sans uppercase tracking-wider font-bold">
                  {filteredEvents.length} eventos · {Object.keys(groupedEvents).length} locales
                </span>
              </div>
              <p className="text-white/50 text-xs mt-0.5">
                Selecciona fechas para ver qué locales tienen programación activa en el Empordà
              </p>
            </div>
          </div>

          {/* Selectores de fecha y accesos rápidos */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Accesos rápidos */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setStartDate(startOfDay(today));
                  setEndDate(endOfDay(addDays(today, 7)));
                }}
                className="px-2.5 py-1.5 text-[11px] uppercase tracking-wider font-bold border border-white/20 text-white/70 hover:border-gold hover:text-gold transition-colors bg-white/5"
              >
                7 días
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = today;
                  const dayOfWeek = now.getDay();
                  const startWeekend = dayOfWeek === 0 ? startOfDay(now) : (dayOfWeek === 6 ? startOfDay(now) : (dayOfWeek === 5 ? startOfDay(now) : startOfDay(nextSaturday(now))));
                  const endWeekend = dayOfWeek === 0 ? endOfDay(now) : endOfDay(nextSunday(startWeekend));
                  setStartDate(startWeekend);
                  setEndDate(endWeekend);
                }}
                className="px-2.5 py-1.5 text-[11px] uppercase tracking-wider font-bold border border-white/20 text-white/70 hover:border-gold hover:text-gold transition-colors bg-white/5"
              >
                Finde
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate(startOfDay(today));
                  setEndDate(endOfDay(endOfMonth(today)));
                }}
                className="px-2.5 py-1.5 text-[11px] uppercase tracking-wider font-bold border border-white/20 text-white/70 hover:border-gold hover:text-gold transition-colors bg-white/5"
              >
                Este mes
              </button>
            </div>

            {/* Inputs de fecha claros */}
            <div className="flex items-center gap-2 bg-neutral-900 border border-white/20 px-3 py-1.5 focus-within:border-gold transition-colors">
              <div className="flex flex-col">
                <label htmlFor="startDate" className="text-gold text-[9px] uppercase tracking-widest font-bold">Desde</label>
                <input 
                  id="startDate"
                  type="date" 
                  value={format(startDate, "yyyy-MM-dd")}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-').map(Number);
                      setStartDate(new Date(y, m - 1, d));
                    }
                  }}
                  className="bg-transparent text-white text-xs md:text-sm font-sans outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
              <span className="text-gold/50 px-1 font-bold">→</span>
              <div className="flex flex-col">
                <label htmlFor="endDate" className="text-gold text-[9px] uppercase tracking-widest font-bold">Hasta</label>
                <input 
                  id="endDate"
                  type="date" 
                  value={format(endDate, "yyyy-MM-dd")}
                  min={format(startDate, "yyyy-MM-dd")}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-').map(Number);
                      setEndDate(new Date(y, m - 1, d));
                    }
                  }}
                  className="bg-transparent text-white text-xs md:text-sm font-sans outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor del Mapa */}
      <div className="h-[60vh] md:h-[650px] w-full border border-white/10 relative z-0 shadow-2xl">
        {locating && (
          <div className="absolute top-4 left-4 z-[500] flex items-center gap-2 bg-black/90 border border-gold/40 px-3 py-1.5 rounded text-gold text-xs shadow-xl animate-pulse">
            <Navigation className="w-3.5 h-3.5 animate-spin" />
            <span>Localizando tu posición...</span>
          </div>
        )}

        <button
          onClick={requestLocation}
          title="Centrar en mi ubicación"
          className="absolute bottom-6 right-6 z-[400] bg-black/90 hover:bg-gold hover:text-black text-white p-3 border border-white/20 hover:border-gold shadow-2xl transition-all cursor-pointer flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
        >
          <Navigation className="w-4 h-4 text-gold group-hover:text-black" />
          <span className="hidden sm:inline">Mi Ubicación</span>
        </button>
        
        <MapContainer 
          center={mapCenter} 
          zoom={12} 
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
          className="z-0 grayscale contrast-125 brightness-75"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={userLocation} />

          {/* Marcador del usuario */}
          {userLocation && (
            <Marker position={userLocation} icon={userIcon}>
              <Popup className="font-sans">
                <div className="text-center p-1">
                  <span className="font-bold text-[10px] uppercase tracking-widest text-black">Tu ubicación actual</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marcadores de eventos agrupados por ubicación */}
          {Object.values(groupedEvents).map((locationEvents) => {
            const firstEvent = locationEvents[0];
            const hasMultiple = locationEvents.length > 1;

            return (
            <Marker key={firstEvent.id} position={[firstEvent.coordinates.lat, firstEvent.coordinates.lng]}>
              <Popup className="font-sans min-w-[270px] max-w-[310px] shadow-2xl">
                <div className="flex flex-col gap-2.5 p-1">
                  {/* Cabecera del Local con Contador */}
                  <div className="border-b border-black/10 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                        <h4 className="font-serif text-lg leading-tight m-0 text-black font-bold">
                          {firstEvent.venueName}
                        </h4>
                      </div>
                      {hasMultiple && (
                        <span className="bg-gold text-black text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full shadow-sm shrink-0">
                          {locationEvents.length} eventos
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 m-0 mt-1 pl-5">
                      {hasMultiple 
                        ? `${locationEvents.length} fechas programadas en el rango` 
                        : "1 evento programado"}
                    </p>
                  </div>

                  {/* Indicador visual de Scroll cuando hay múltiples eventos */}
                  {hasMultiple && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 text-[10px] px-2.5 py-1 rounded flex items-center justify-between font-medium">
                      <span>↕ Desliza la lista para ver todos</span>
                      <span className="text-[9px] uppercase font-bold text-amber-700 bg-amber-200/50 px-1 py-0.2 rounded">
                        Scroll ↓
                      </span>
                    </div>
                  )}

                  {/* Lista con Scrollbar visible para múltiples eventos */}
                  <div className={`flex flex-col gap-3 pr-1.5 overflow-y-auto ${hasMultiple ? 'max-h-[220px]' : 'max-h-[260px]'} [scrollbar-width:thin] [scrollbar-color:#C5A059_#e5e7eb] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gold [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100`}>
                    {locationEvents.map((event, idx) => (
                      <div key={event.id} className="flex flex-col gap-1 border-b border-black/10 pb-2.5 last:border-0 relative pr-6">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider text-amber-900 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                            {format(parseISO(event.date), "EEE dd MMM · HH:mm", { locale: es })}
                          </span>
                          {hasMultiple && (
                            <span className="text-[9px] text-gray-400 font-mono">
                              #{idx + 1} de {locationEvents.length}
                            </span>
                          )}
                        </div>

                        <p className="font-bold text-sm leading-tight m-0 text-black mt-1">{event.title}</p>
                        
                        {event.musicianName && (
                          <p className="text-[11px] text-gray-600 m-0">
                            Artista: <strong className="text-black">{event.musicianName}</strong>
                          </p>
                        )}

                        {isFavorite(event.id) && (
                          <Heart className="w-4 h-4 absolute top-1 right-0 text-red-500 fill-red-500" />
                        )}
                        
                        <button 
                          onClick={() => navigate(`/event/${event.id}`)}
                          className="w-full block bg-gold !text-black text-[10px] uppercase tracking-widest text-center py-1.5 px-3 hover:bg-black hover:!text-gold transition-colors font-bold border border-gold cursor-pointer mt-1 rounded-sm shadow-sm"
                        >
                          Ver Evento
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Botón Cómo llegar fijo al pie */}
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${firstEvent.coordinates.lat},${firstEvent.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block bg-black !text-white text-[10px] uppercase tracking-widest text-center py-2 px-4 hover:!bg-neutral-800 transition-colors border border-black cursor-pointer mt-1 rounded-sm shadow-sm"
                    style={{ color: 'white', textDecoration: 'none' }}
                  >
                    📍 Cómo llegar a {firstEvent.venueName}
                  </a>
                </div>
              </Popup>
            </Marker>
          );})}
        </MapContainer>
      </div>
    </div>
  );
};
