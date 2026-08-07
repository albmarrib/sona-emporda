import { useState } from 'react';
import { FiSearch, FiMic, FiFilter, FiMapPin, FiStar, FiPlayCircle, FiMessageSquare } from 'react-icons/fi';
import { mockMusicianProfile } from '../../data/mockMusicianData';

interface VenueSearchResult {
  id: string;
  name: string;
  genres: string[];
  location: string;
  bio: string;
  profileImageUrl: string;
  experienceYears: number;
  rating: number;
  reviewsCount: number;
}

// Generamos algunos datos extra mockeados rápidamente mezclando el mock base
const mockResults: VenueSearchResult[] = [
  {
    id: mockMusicianProfile.id,
    name: mockMusicianProfile.stageName,
    genres: [mockMusicianProfile.mainGenre, 'Pop'],
    location: 'Palafrugell',
    bio: mockMusicianProfile.shortBio,
    profileImageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=1600',
    experienceYears: 8,
    rating: mockMusicianProfile.rating,
    reviewsCount: mockMusicianProfile.reviewsCount
  },
  {
    id: "musician-456",
    name: "Midnight Jazz Trio",
    genres: ["Jazz", "Soul"],
    location: "Figueres",
    bio: "Trío elegante ideal para cenas y eventos corporativos. Contamos con repertorio clásico y versiones modernas en clave de jazz.",
    profileImageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=1600",
    experienceYears: 12,
    rating: 4.5,
    reviewsCount: 8
  },
  {
    id: "musician-789",
    name: "DJ Riera",
    genres: ["Electrónica", "House", "Tardeo"],
    location: "Palamós",
    bio: "Especialista en sesiones de tardeo y puesta de sol. Residencias en varios beach clubs de la Costa Brava.",
    profileImageUrl: "https://images.unsplash.com/photo-1542222835-300b12bc173c?auto=format&fit=crop&q=80&w=1600",
    experienceYears: 5,
    rating: 4.8,
    reviewsCount: 32
  }
];

export const ArtistSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isChatMode, setIsChatMode] = useState(true); // Default to AI chat mode

  return (
    <div className="flex flex-col gap-8 max-w-5xl h-[calc(100vh-12rem)]">
      
      <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white mb-2">Booking & Búsqueda</h1>
          <p className="text-white/50 text-xs uppercase tracking-widest">Encuentra el talento perfecto para tu próximo evento</p>
        </div>

        <div className="flex items-center gap-2 bg-black border border-white/10 p-1 rounded-sm">
          <button 
            onClick={() => setIsChatMode(true)}
            className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors ${isChatMode ? 'bg-gold text-black' : 'text-white/60 hover:text-white'}`}
          >
            Agente IA
          </button>
          <button 
            onClick={() => setIsChatMode(false)}
            className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors ${!isChatMode ? 'bg-gold text-black' : 'text-white/60 hover:text-white'}`}
          >
            Buscador Clásico
          </button>
        </div>
      </div>

      {isChatMode ? (
        <div className="flex-1 flex flex-col bg-zinc-950 border border-white/10 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent pointer-events-none"></div>
          
          <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col gap-6">
            
            <div className="flex gap-4 max-w-2xl">
              <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/50 flex items-center justify-center shrink-0">
                <FiSearch className="text-gold w-4 h-4" />
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-r-xl rounded-bl-xl">
                <p className="text-sm text-white/80 leading-relaxed">
                  Hola. Soy tu <strong>Agente de Booking IA</strong> de Sona Empordà. Conozco la disponibilidad, el caché y el estilo de todos los músicos de la plataforma.
                  <br/><br/>
                  ¿Qué estás buscando para tu local? (Ej: *"Necesito un grupo de rumba animado para este sábado por la tarde, presupuesto 400€"*).
                </p>
              </div>
            </div>

            {/* Example user message */}
            {searchQuery && (
              <div className="flex gap-4 max-w-2xl self-end flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <span className="text-[10px] text-white/50">TÚ</span>
                </div>
                <div className="bg-gold/10 border border-gold/20 p-4 rounded-l-xl rounded-br-xl">
                  <p className="text-sm text-white leading-relaxed">
                    {searchQuery}
                  </p>
                </div>
              </div>
            )}

          </div>

          <div className="p-4 border-t border-white/10 bg-black">
            <div className="relative flex items-center">
              <input 
                type="text" 
                placeholder="Escribe tu petición aquí..." 
                className="w-full bg-white/5 border border-white/10 py-4 pl-4 pr-16 text-sm text-white focus:border-gold focus:outline-none focus:bg-white/10 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchQuery(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button className="absolute right-4 text-white/50 hover:text-gold transition-colors">
                <FiMic className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6">
          {/* Classic Search Header */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input 
                type="text" 
                placeholder="Buscar por nombre, género o instrumento..." 
                className="w-full bg-zinc-950 border border-white/10 py-3 pl-12 pr-4 text-sm text-white focus:border-gold focus:outline-none"
              />
            </div>
            <button className="flex items-center justify-center gap-2 bg-zinc-950 border border-white/10 px-6 py-3 text-[10px] uppercase tracking-widest text-white hover:text-gold transition-colors">
              <FiFilter /> Filtros Avanzados
            </button>
          </div>

          <div className="flex gap-2 text-[10px] uppercase tracking-widest text-white/40 mb-2">
            Resultados: {mockResults.length} músicos encontrados
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto pb-8">
            {mockResults.map(artist => (
              <div key={artist.id} className="bg-zinc-950 border border-white/10 flex flex-col hover:border-white/30 transition-colors group">
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10"></div>
                  <img src={artist.profileImageUrl} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute bottom-4 left-4 z-20">
                    <h3 className="text-2xl font-serif text-white">{artist.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gold mt-1">
                      <FiMapPin /> {artist.location}
                    </div>
                  </div>
                  <button className="absolute bottom-4 right-4 z-20 bg-gold text-black p-3 rounded-full hover:bg-white transition-colors shadow-lg">
                    <FiPlayCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="p-6 flex flex-col gap-4 flex-1">
                  <div className="flex flex-wrap gap-2">
                    {artist.genres.map(g => (
                      <span key={g} className="bg-white/5 border border-white/10 px-2 py-1 text-[10px] uppercase tracking-widest text-white/70">
                        {g}
                      </span>
                    ))}
                  </div>
                  
                  <p className="text-sm text-white/60 line-clamp-2 leading-relaxed">
                    {artist.bio}
                  </p>

                  <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-gold">
                      <FiStar className="w-4 h-4 fill-gold" />
                      <span className="font-bold text-sm ml-1">{artist.rating.toFixed(1)}</span>
                      <span className="text-white/40 text-[10px]">({artist.reviewsCount})</span>
                    </div>
                    <button className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white hover:text-gold transition-colors">
                      <FiMessageSquare /> Ver EPK y Contactar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
};
