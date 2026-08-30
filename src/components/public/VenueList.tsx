import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { addDays, isWithinInterval, parseISO, format } from "date-fns";
import { es } from "date-fns/locale";
import { Heart } from "lucide-react";
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
  
  const { isFavorite } = useFavorites();
  
  // Date filters
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDays(today, 7));

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
    if (!event.date || event.status === 'cancelled' || event.status === 'musician_cancelled') return false;
    const eventDate = parseISO(event.date);
    if (isNaN(eventDate.getTime())) return false;
    const matchesDate = isWithinInterval(eventDate, { start: startDate, end: endDate });
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
      {/* Controles de fecha superiores */}
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
      <div className="h-[60vh] md:h-[650px] w-full border border-white/10 relative z-0 shadow-2xl">
        {!userLocation && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <span className="text-gold font-serif text-xl animate-pulse">Ubicando...</span>
          </div>
        )}
        
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
            return (
            <Marker key={firstEvent.id} position={[firstEvent.coordinates.lat, firstEvent.coordinates.lng]}>
              <Popup className="font-sans min-w-[250px] shadow-2xl">
                <div className="flex flex-col gap-4 p-1 max-h-[300px] overflow-y-auto">
                  <h4 className="font-serif text-lg leading-tight m-0 text-black border-b border-black/10 pb-2">
                    {firstEvent.venueName}
                  </h4>
                  
                  {locationEvents.map(event => (
                    <div key={event.id} className="flex flex-col gap-1 border-b border-black/5 pb-2 last:border-0 relative pr-6">
                      <span className="text-[10px] uppercase tracking-widest text-gold font-bold">
                        {format(parseISO(event.date), "dd MMM - HH:mm", { locale: es })}
                      </span>
                      <p className="font-bold text-sm leading-tight m-0 text-black">{event.title}</p>
                      {isFavorite(event.id) && (
                        <Heart className="w-4 h-4 absolute top-1 right-0 text-red-500 fill-red-500" />
                      )}
                      
                      <button 
                        onClick={() => navigate(`/event/${event.id}`)}
                        className="w-full block bg-gold !text-black text-[10px] uppercase tracking-widest text-center py-1.5 px-4 hover:bg-black hover:!text-gold transition-colors font-bold border border-gold cursor-pointer mt-1"
                      >
                        Ver Evento
                      </button>
                    </div>
                  ))}

                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${firstEvent.coordinates.lat},${firstEvent.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block bg-black !text-white text-[10px] uppercase tracking-widest text-center py-2 px-4 hover:!bg-white/10 transition-colors border border-black cursor-pointer mt-2"
                    style={{ color: 'white', textDecoration: 'none' }}
                  >
                    📍 Cómo llegar
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
