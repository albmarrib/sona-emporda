import { useState, useEffect } from 'react';
import { FiSearch, FiMic, FiFilter, FiMapPin, FiStar, FiPlayCircle, FiMessageSquare, FiCheckCircle, FiX } from 'react-icons/fi';
import { allMockMusicians } from '../../data/mockMusicianData';
import { EPKModal } from '../../components/shared/EPKModal';
import { db } from '../../firebase/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';



export const ArtistSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{sender: 'user' | 'ai', text: string}[]>([]);
  const [isChatMode, setIsChatMode] = useState(false);
  const [contacted, setContacted] = useState<string[]>([]);
  const { currentUser } = useAuth();
  const [selectedArtist, setSelectedArtist] = useState<any | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [genreFilter, setGenreFilter] = useState('Todos');

  const [realMusicians, setRealMusicians] = useState<any[]>([]);

  useEffect(() => {
    const fetchRealMusicians = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'musician'));
        const snapshot = await getDocs(q);
        const musicians = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            stageName: data.stageName || data.name || 'Músico Sin Nombre',
            mainGenre: data.genre || 'Varios',
            profileImageUrl: data.profileImageUrl || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400',
            rating: data.rating || 5.0,
            reviewsCount: data.reviewsCount || 1,
            calendar: data.calendar || {},
            contactWhatsapp: data.phone || '',
            description: data.bio || 'Músico registrado en Sona Empordà.',
            location: data.location || 'Empordà'
          };
        });
        setRealMusicians(musicians);
      } catch (e) {
        console.error("Error fetching real musicians", e);
      }
    };
    fetchRealMusicians();
  }, []);

  const combinedMusicians = [...realMusicians, ...allMockMusicians];

  const filteredResults = combinedMusicians.filter(artist => {
    const matchesSearch = artist.stageName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          artist.mainGenre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = genreFilter === 'Todos' || artist.mainGenre === genreFilter;
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
      setContacted([...contacted, artist.id]);
      setSelectedArtist(null);
    } catch (e) {
      console.error(e);
      alert("Hubo un error al guardar el log de la propuesta, pero puedes continuar en WhatsApp.");
    }
  };

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

            {/* Chat Messages */}
            {aiMessages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 max-w-2xl ${msg.sender === 'user' ? 'self-end flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-white/10 border border-white/20' : 'bg-gold/20 border border-gold/50'}`}>
                  {msg.sender === 'user' ? <span className="text-[10px] text-white/50">TÚ</span> : <FiSearch className="text-gold w-4 h-4" />}
                </div>
                <div className={`p-4 ${msg.sender === 'user' ? 'bg-gold/10 border border-gold/20 rounded-l-xl rounded-br-xl' : 'bg-white/5 border border-white/10 rounded-r-xl rounded-bl-xl'}`}>
                  <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}

          </div>

          <div className="p-4 border-t border-white/10 bg-black">
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Escribe tu petición aquí..." 
                className="w-full bg-white/5 border border-white/10 py-4 pl-4 pr-16 text-sm text-white focus:border-gold focus:outline-none focus:bg-white/10 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && aiInput.trim() !== '') {
                    const newMsg = { sender: 'user' as const, text: aiInput };
                    setAiMessages(prev => [...prev, newMsg]);
                    setAiInput('');
                    
                    // Simulate AI response
                    setTimeout(() => {
                      setAiMessages(prev => [...prev, { 
                        sender: 'ai', 
                        text: "He recibido tu petición. Como Agente de Booking IA, en el futuro podré contactar directamente con los músicos que encajen en esta descripción y gestionar las negociaciones por ti.\\n\\nSi deseas buscar manualmente, puedes usar la pestaña 'Buscador Clásico' de forma independiente." 
                      }]);
                    }, 1000);
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, género o instrumento..." 
                className="w-full bg-zinc-950 border border-white/10 py-3 pl-12 pr-4 text-sm text-white focus:border-gold focus:outline-none"
              />
            </div>
            <button onClick={() => setShowFilters(true)} className="flex items-center justify-center gap-2 bg-zinc-950 border border-white/10 px-6 py-3 text-[10px] uppercase tracking-widest text-white hover:text-gold transition-colors">
              <FiFilter /> Filtros Avanzados
            </button>
          </div>

          <div className="flex gap-2 text-[10px] uppercase tracking-widest text-white/40 mb-2">
            Resultados: {filteredResults.length} músicos encontrados
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto pb-8">
            {filteredResults.map(artist => {
              const isContacted = contacted.includes(artist.id);
              return (
              <div key={artist.id} className="bg-zinc-950 border border-white/10 flex flex-col hover:border-white/30 transition-colors group">
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10"></div>
                  <img src={artist.profileImageUrl} alt={artist.stageName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute bottom-4 left-4 z-20">
                    <h3 className="text-2xl font-serif text-white">{artist.stageName}</h3>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gold mt-1">
                      <FiMapPin /> {'Catalunya'}
                    </div>
                  </div>
                  <button className="absolute bottom-4 right-4 z-20 bg-gold text-black p-3 rounded-full hover:bg-white transition-colors shadow-lg">
                    <FiPlayCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="p-6 flex flex-col gap-4 flex-1">
                  <div className="flex flex-wrap gap-2">
                    {[artist.mainGenre].map((g: string) => (
                      <span key={g} className="bg-white/5 border border-white/10 px-2 py-1 text-[10px] uppercase tracking-widest text-white/70">
                        {g}
                      </span>
                    ))}
                  </div>
                  
                  <p className="text-sm text-white/60 line-clamp-2 leading-relaxed">
                    {(artist as any).shortBio || 'Sin biografía disponible.'}
                  </p>

                  <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-gold">
                      <FiStar className="w-4 h-4 fill-gold" />
                      <span className="font-bold text-sm ml-1">{artist.rating.toFixed(1)}</span>
                      <span className="text-white/40 text-[10px]">({artist.reviewsCount})</span>
                    </div>
                    {isContacted ? (
                      <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-green-500">
                        <FiCheckCircle /> Contactado
                      </span>
                    ) : (
                      <button onClick={() => setSelectedArtist(artist)} className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white hover:text-gold transition-colors">
                        <FiMessageSquare /> Ver EPK y Contactar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </div>

        </div>
      )}

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 p-6 md:p-8 max-w-sm w-full shadow-2xl relative">
            <button onClick={() => setShowFilters(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <FiX className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-serif text-white mb-6">Filtros Avanzados</h2>
            
            <div className="flex flex-col gap-4 mb-8">
              <label className="text-[10px] uppercase tracking-widest text-white/50">Género</label>
              <select value={genreFilter} onChange={e => setGenreFilter(e.target.value)} className="bg-white/5 border border-white/10 p-3 text-sm text-white focus:outline-none focus:border-gold">
                <option value="Todos" className="bg-zinc-950 text-white">Todos</option>
                <option value="Indie" className="bg-zinc-950 text-white">Indie / Alternativo</option>
                <option value="Rock" className="bg-zinc-950 text-white">Rock</option>
                <option value="Pop" className="bg-zinc-950 text-white">Pop</option>
                <option value="Electrónica" className="bg-zinc-950 text-white">Electrónica / DJ</option>
                <option value="Acústico" className="bg-zinc-950 text-white">Acústico / Cantautor</option>
                <option value="Jazz" className="bg-zinc-950 text-white">Jazz / Soul</option>
              </select>

              <label className="text-[10px] uppercase tracking-widest text-white/50 mt-4">Caché Máximo</label>
              <input type="range" className="w-full accent-gold" />
            </div>

            <button onClick={() => setShowFilters(false)} className="w-full bg-gold text-black font-bold uppercase tracking-widest text-[10px] py-4 hover:bg-white transition-colors">
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

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
