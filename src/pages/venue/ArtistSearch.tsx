import { useState, useEffect } from 'react';
import { FiSearch, FiMapPin, FiStar, FiCheckCircle, FiX } from 'react-icons/fi';
import { EPKModal } from '../../components/shared/EPKModal';
import { db } from '../../firebase/firebase';
import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../hooks/useSettings';

// In-memory cache so switching tabs on mobile or desktop shows all musicians instantly without refetch delay
let cachedMusicians: any[] = [];

export const ArtistSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('Todos');
  const [contacted, setContacted] = useState<string[]>([]);
  const { currentUser } = useAuth();
  const [selectedArtist, setSelectedArtist] = useState<any | null>(null);

  const { settings } = useSettings();

  const [realMusicians, setRealMusicians] = useState<any[]>(cachedMusicians);
  const [loadingMusicians, setLoadingMusicians] = useState(cachedMusicians.length === 0);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'musician'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const musicians = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          stageName: data.stageName || data.name || 'Músico Sin Nombre',
          mainGenre: data.mainGenre || data.genre || 'Varios',
          profileImageUrl: data.profileImageUrl || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400',
          rating: typeof data.rating === 'number' ? data.rating : 5.0,
          reviewsCount: typeof data.reviewsCount === 'number' ? data.reviewsCount : (data.reviewsCount || 0),
          calendar: data.calendar || {},
          contactWhatsapp: data.contactWhatsapp ? String(data.contactWhatsapp) : (data.phone ? String(data.phone) : ''),
          contactPhone: data.contactPhone ? String(data.contactPhone) : (data.phone ? String(data.phone) : ''),
          description: data.bio || data.shortBio || 'Músico registrado en Sona Empordà.',
          baseLocation: data.baseLocation || ''
        };
      });
      cachedMusicians = musicians;
      setRealMusicians(musicians);
      setLoadingMusicians(false);
    }, (error) => {
      console.error("Error fetching real musicians", error);
      setLoadingMusicians(false);
    });

    return () => unsubscribe();
  }, []);

  const combinedMusicians = [...realMusicians];

  const filteredResults = combinedMusicians.filter(artist => {
    const matchesSearch = artist.stageName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          artist.mainGenre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = genreFilter === 'Todos' || artist.mainGenre.toLowerCase() === genreFilter.toLowerCase();
    return matchesSearch && matchesGenre;
  });

  const handleContact = async (artist: any) => {
    try {
      await addDoc(collection(db, 'booking_proposals'), {
        title: `Propuesta de Booking Directa`,
        venueName: currentUser?.email || 'Sala Soho',
        location: 'Ubicación local',
        dateStr: 'A convenir',
        price: 'A convenir',
        requiredVibes: ['📅 Booking'],
        description: `¡Hola ${artist.stageName}! Nos gustaría ofrecerte un bolo. Por favor, revisa esta propuesta y envíanos tu EPK.`,
        isUrgent: false,
        postedAt: new Date().toISOString(),
        status: 'pending',
        venueId: currentUser?.uid || 'venue-123',
        musicianId: artist.id
      });
      setContacted(prev => [...prev, artist.id]);
      setSelectedArtist(null);
    } catch (e) {
      console.error(e);
      alert("Hubo un error al guardar el log de la propuesta, pero puedes continuar en WhatsApp.");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl px-4 sm:px-6 py-4 pb-28">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl md:text-2xl font-serif text-white uppercase tracking-widest">
          Músicos
        </h1>
      </div>

      <div className="flex-1 flex flex-col gap-5">
        {/* Search & Genre Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input with Clear Button */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, estilo..." 
              className="w-full bg-zinc-950 border border-white/10 py-3 pl-11 pr-10 text-sm text-white focus:border-gold focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors"
                title="Borrar búsqueda"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Direct Genre Dropdown */}
          <div className="w-full sm:w-56 shrink-0 relative">
            <select 
              value={genreFilter} 
              onChange={e => setGenreFilter(e.target.value)} 
              className="w-full bg-zinc-950 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none cursor-pointer transition-colors"
            >
              <option value="Todos" className="bg-zinc-950 text-white">Todos los géneros</option>
              {settings.genres.map(genre => (
                <option key={genre} value={genre} className="bg-zinc-950 text-white">{genre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results counter & active filter indicator */}
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/40">
          <span>{filteredResults.length} músico{filteredResults.length !== 1 ? 's' : ''} disponible{filteredResults.length !== 1 ? 's' : ''}</span>
          {(searchQuery || genreFilter !== 'Todos') && (
            <button 
              onClick={() => { setSearchQuery(''); setGenreFilter('Todos'); }} 
              className="text-gold hover:underline flex items-center gap-1 lowercase tracking-normal"
            >
              <FiX className="w-3 h-3" /> restablecer filtros
            </button>
          )}
        </div>

        {/* Results Grid */}
        {loadingMusicians && filteredResults.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-white/50">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <p className="text-xs uppercase tracking-widest text-gold/80">Cargando músicos...</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="py-16 text-center border border-white/5 bg-zinc-950/50 p-8 rounded-sm">
            <p className="text-white/60 text-sm mb-2">No se encontraron músicos con los filtros actuales.</p>
            <button 
              onClick={() => { setSearchQuery(''); setGenreFilter('Todos'); }}
              className="text-xs text-gold uppercase tracking-widest hover:underline mt-2 inline-block font-bold"
            >
              Ver todos los músicos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 pb-8">
            {filteredResults.map(artist => {
              const isContacted = contacted.includes(artist.id);
              return (
                <div 
                  key={artist.id} 
                  onClick={() => setSelectedArtist(artist)}
                  className="bg-zinc-950 border border-white/10 flex flex-col hover:border-gold/50 cursor-pointer active:scale-[0.99] transition-all group rounded-sm overflow-hidden shadow-lg select-none"
                >
                  <div className="h-44 sm:h-48 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10"></div>
                    <img 
                      src={artist.profileImageUrl} 
                      alt={artist.stageName} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute bottom-3 left-4 z-20">
                      <h3 className="text-xl sm:text-2xl font-serif text-white group-hover:text-gold transition-colors">
                        {artist.stageName}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gold/90 mt-0.5">
                        <FiMapPin /> {artist.baseLocation || 'Empordà'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-5 flex flex-col gap-3 flex-1">
                    <div className="flex flex-wrap gap-2">
                      {[artist.mainGenre].map((g: string) => (
                        <span key={g} className="bg-white/5 border border-white/10 px-2 py-1 text-[10px] uppercase tracking-widest text-white/70">
                          {g}
                        </span>
                      ))}
                    </div>
                    
                    <p className="text-sm text-white/60 line-clamp-2 leading-relaxed">
                      {(artist as any).shortBio || (artist as any).description || 'Músico registrado en Sona Empordà.'}
                    </p>

                    <div className="mt-auto pt-3 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-gold">
                        <FiStar className="w-4 h-4 fill-gold" />
                        <span className="font-bold text-sm ml-1">{artist.rating.toFixed(1)}</span>
                        <span className="text-white/40 text-[10px]">({artist.reviewsCount})</span>
                      </div>
                      
                      {isContacted ? (
                        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-green-500">
                          <FiCheckCircle className="w-3.5 h-3.5" /> Contactado
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-widest text-gold/80 group-hover:text-gold font-bold flex items-center gap-1 transition-colors">
                          Ver EPK →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* EPK Modal */}
      {selectedArtist && (
        <EPKModal 
          artist={selectedArtist} 
          dateKey="" 
          currentUser={currentUser} 
          onClose={() => setSelectedArtist(null)} 
          onContacted={() => {
            handleContact(selectedArtist);
          }}
        />
      )}
    </div>
  );
};
