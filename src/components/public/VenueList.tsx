import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { addDays, isWithinInterval, parseISO, format } from "date-fns";
import { es } from "date-fns/locale";
import { FiLayers } from "react-icons/fi";
import type { SonaEvent } from "../../data/mockEvents";

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

const VIBES = ["TODOS", "BAILAR", "TARDEO", "ACÚSTICO", "ELECTRÓNICA", "CENA"];

interface VenueMapProps {
  events: SonaEvent[];
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

export const VenueList = ({ events }: VenueMapProps) => {
  const navigate = useNavigate();
  const MOCK_TODAY = new Date("2026-08-14"); // Simulated "today"
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  // Date filters
  const [startDate, setStartDate] = useState(MOCK_TODAY);
  const [endDate, setEndDate] = useState(addDays(MOCK_TODAY, 7));
  
  // Vibe/Layer filter
  const [activeVibe, setActiveVibe] = useState("TODOS");
  const [showLayers, setShowLayers] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation([position.coords.latitude, position.coords.longitude]),
        () => setUserLocation(DEFAULT_CENTER)
      );
    } else {
      setUserLocation(DEFAULT_CENTER);
    }
  }, []);

  const filteredEvents = events.filter(event => {
    const eventDate = parseISO(event.date);
    const matchesDate = isWithinInterval(eventDate, { start: startDate, end: endDate });
    const matchesVibe = activeVibe === "TODOS" || event.vibes.some(v => v.toUpperCase().includes(activeVibe));
    return matchesDate && matchesVibe;
  });

  const mapCenter = userLocation || DEFAULT_CENTER;

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-12 relative">
      {/* Controles de fecha superiores (Solo fechas) */}
      <div className="flex justify-end p-4">
        <div className="flex items-center gap-4 bg-black p-3 border border-white/10 shadow-xl">
          <div className="flex flex-col">
            <label htmlFor="startDate" className="text-gold text-[9px] uppercase tracking-widest cursor-pointer">Desde</label>
            <input 
              id="startDate"
              type="date" 
              value={format(startDate, "yyyy-MM-dd")}
              onChange={(e) => setStartDate(new Date(e.target.value))}
              className="bg-transparent text-white text-sm font-serif outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>
          <span className="text-white/20 px-2">|</span>
          <div className="flex flex-col">
            <label htmlFor="endDate" className="text-gold text-[9px] uppercase tracking-widest cursor-pointer">Hasta</label>
            <input 
              id="endDate"
              type="date" 
              value={format(endDate, "yyyy-MM-dd")}
              min={format(startDate, "yyyy-MM-dd")}
              onChange={(e) => setEndDate(new Date(e.target.value))}
              className="bg-transparent text-white text-sm font-serif outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>
        </div>
      </div>

      {/* Contenedor del Mapa */}
      <div className="h-[650px] w-full border border-white/10 relative z-0 shadow-2xl">
        {!userLocation && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <span className="text-gold font-serif text-xl animate-pulse">Ubicando...</span>
          </div>
        )}

        {/* Floating Layers Control */}
        <div className="absolute top-4 right-4 z-[400] flex flex-col items-end">
          <button 
            onClick={() => setShowLayers(!showLayers)}
            className="w-12 h-12 bg-black border border-white/20 flex items-center justify-center hover:border-gold transition-colors shadow-2xl"
          >
            <FiLayers className="text-gold w-6 h-6" />
          </button>
          
          {showLayers && (
            <div className="mt-2 bg-black border border-white/20 p-4 shadow-2xl animate-in slide-in-from-top-2 w-48">
              <p className="text-white/40 text-[9px] uppercase tracking-widest mb-3 border-b border-white/10 pb-2">Capas de Eventos</p>
              <div className="flex flex-col gap-2">
                {VIBES.map(vibe => (
                  <button
                    key={vibe}
                    onClick={() => {
                      setActiveVibe(vibe);
                      setShowLayers(false);
                    }}
                    className={`text-[10px] uppercase tracking-[0.2em] text-left px-2 py-2 transition-colors duration-300 ${
                      activeVibe === vibe ? "bg-white/10 text-gold font-bold" : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {vibe}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <MapContainer 
          center={mapCenter} 
          zoom={12} 
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

          {/* Marcadores de eventos */}
          {filteredEvents.map(event => (
            <Marker key={event.id} position={[event.coordinates.lat, event.coordinates.lng]}>
              <Popup className="font-sans min-w-[200px] shadow-2xl">
                <div className="flex flex-col gap-2 p-1">
                  <span className="text-[10px] uppercase tracking-widest text-gold font-bold">
                    {format(parseISO(event.date), "dd MMM - HH:mm", { locale: es })}
                  </span>
                  <h4 className="font-serif text-lg leading-tight m-0 text-black">{event.title}</h4>
                  <p className="text-[10px] uppercase tracking-widest text-black/60 m-0">
                    {event.venueName}
                  </p>
                  
                  <div className="flex flex-col gap-1 mt-4">
                    <button 
                      onClick={() => navigate(`/event/${event.id}`)}
                      className="w-full block bg-gold !text-black text-[10px] uppercase tracking-widest text-center py-2 px-4 hover:bg-black hover:!text-gold transition-colors font-bold border border-gold cursor-pointer"
                    >
                      Ver Evento
                    </button>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${event.coordinates.lat},${event.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full block bg-black !text-white text-[10px] uppercase tracking-widest text-center py-2 px-4 hover:!bg-white/10 transition-colors border border-black cursor-pointer"
                      style={{ color: 'white', textDecoration: 'none' }}
                    >
                      📍 Cómo llegar
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};
