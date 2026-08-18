import { useParams, useNavigate } from "react-router-dom";
import { Header } from "../../components/public/Header";
import { useEvents } from "../../hooks/useEvents";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { FiArrowLeft, FiMapPin, FiCalendar, FiClock, FiMusic, FiAward } from "react-icons/fi";
import { useMusicianProfile } from "../../hooks/useMusicianProfile";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

export const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, loading, error } = useEvents();
  
  const event = events.find(e => e.id === id);
  const { profile: musicianProfile } = useMusicianProfile(event?.musicianId);
  const [venueProfile, setVenueProfile] = useState<any>(null);

  useEffect(() => {
    if (event?.venueId) {
      getDoc(doc(db, 'users', event.venueId)).then(docSnap => {
        if (docSnap.exists()) {
          setVenueProfile(docSnap.data());
        }
      });
    }
  }, [event?.venueId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gold font-serif text-2xl tracking-widest animate-pulse">
          Cargando Evento...
        </div>
      </div>
    );
  }



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
            {/* Massive Tier 3 Overlay */}
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
            
            {/* Prominent Tier 2 Overlay */}
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

            {/* Clear Tier 1 Overlay */}
            {event.sponsorTier === 1 && (
              <div className="absolute top-6 right-6 md:top-10 md:right-10 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs md:text-sm uppercase tracking-widest px-6 py-3 shadow-2xl z-20">
                Presentado por <span className="font-bold text-gold ml-2 text-base md:text-lg">{event.sponsorName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Level 3 Sponsor Huge Banner Bottom */}
        {event.sponsorTier === 3 && (
          <div className="px-6 mb-12">
            <a 
              href={event.sponsorLink || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full border-2 border-gold/50 bg-gradient-to-r from-gold/10 via-gold/20 to-black p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 hover:bg-gold/20 transition-all duration-500 group cursor-pointer shadow-[0_0_30px_rgba(255,215,0,0.1)] rounded-xl"
            >
              <div className="flex-1">
                <p className="text-xs md:text-sm text-gold uppercase tracking-[0.4em] mb-3 font-bold flex items-center gap-3">
                  <FiAward className="w-5 h-5 animate-pulse" /> Patrocinador Oficial
                </p>
                <h3 className="text-2xl md:text-4xl font-serif text-white group-hover:text-gold transition-colors leading-tight">{event.sponsorMessage || `Este gran evento es posible gracias a ${event.sponsorName}`}</h3>
              </div>
              <div className="flex-shrink-0">
                 <span className="text-sm md:text-base uppercase tracking-widest border-2 border-gold text-gold px-8 py-4 font-bold group-hover:bg-gold group-hover:text-black transition-colors rounded-lg shadow-lg">Descubrir Marca</span>
              </div>
            </a>
          </div>
        )}

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
            
            <h1 className="text-4xl md:text-6xl font-serif leading-tight mb-4">
              {event.title}
            </h1>
            
            {(event.musicianName || musicianProfile?.stageName) && (
              <div className="flex items-center gap-3 mb-8">
                <FiMusic className="text-gold w-6 h-6" />
                <h2 className="text-2xl font-serif text-white/90">
                  {event.musicianName || musicianProfile?.stageName}
                </h2>
              </div>
            )}

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

            {/* Artist Section (if musician is registered) */}
            {event.musicianId && musicianProfile && (
              <div className="mt-16 pt-12 border-t border-white/10">
                <h3 className="text-2xl font-serif text-white mb-8 border-l-4 border-gold pl-4">Conoce al Artista</h3>
                
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-1/3 shrink-0">
                    <img 
                      src={musicianProfile.profileImageUrl || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=600'} 
                      alt={musicianProfile.stageName} 
                      className="w-full h-auto object-cover grayscale opacity-90 border border-white/10"
                    />
                    <div className="mt-4 flex gap-2">
                        <span className="bg-white/5 border border-white/10 px-3 py-1 text-[10px] uppercase tracking-widest text-white/70">
                          {musicianProfile.mainGenre}
                        </span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col gap-6">
                    <div>
                      <h4 className="text-xl font-serif text-white mb-2">{musicianProfile.stageName}</h4>
                      <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                        {musicianProfile.shortBio || "No hay biografía disponible."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 border border-white/10">
                      <div>
                        <h4 className="text-[10px] uppercase tracking-widest text-white/50">Formación</h4>
                        <p className="text-lg text-white font-serif capitalize">
                          {musicianProfile.formationType || "Solista"} {musicianProfile.membersCount ? `(${musicianProfile.membersCount} pax)` : ''}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-[10px] uppercase tracking-widest text-white/50">Miembros</h4>
                        <p className="text-sm text-white/80 mt-1 capitalize leading-relaxed">
                          {musicianProfile.membersNames || 'No especificados'}
                        </p>
                      </div>
                    </div>

                    {(musicianProfile.youtubeUrl || musicianProfile.spotifyUrl) && (
                      <div className="flex flex-col sm:flex-row gap-4 mt-2">
                        {musicianProfile.youtubeUrl && (
                          <a href={musicianProfile.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex-1 border border-red-600/50 text-red-500 hover:bg-red-600 hover:text-white transition-colors py-3 flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-bold">
                            Ver Video
                          </a>
                        )}
                        {musicianProfile.spotifyUrl && (
                          <a href={musicianProfile.spotifyUrl} target="_blank" rel="noopener noreferrer" className="flex-1 border border-green-500/50 text-green-500 hover:bg-green-500 hover:text-white transition-colors py-3 flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-bold">
                            Escuchar
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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

              {(venueProfile?.contactPhone || venueProfile?.contactWhatsapp || venueProfile?.email || venueProfile?.websiteUrl || venueProfile?.instagramUrl) && (
                <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
                  <h3 className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Contacto con el Local</h3>
                  <div className="flex flex-wrap gap-2">
                    {venueProfile.contactWhatsapp && (
                      <a href={`https://wa.me/${venueProfile.contactWhatsapp.replace(/\+/g, '').replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer" className="bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/50 hover:bg-[#25D366] hover:text-white transition-colors px-3 py-1 flex items-center justify-center gap-2 text-[9px] uppercase tracking-widest font-bold">
                        WhatsApp
                      </a>
                    )}
                    {venueProfile.contactPhone && (
                      <a href={`tel:${venueProfile.contactPhone.replace(/\s/g, '')}`} className="bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500 hover:text-white transition-colors px-3 py-1 flex items-center justify-center gap-2 text-[9px] uppercase tracking-widest font-bold">
                        Llamar
                      </a>
                    )}
                    {venueProfile.email && (
                      <a href={`mailto:${venueProfile.email}`} className="bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors px-3 py-1 flex items-center justify-center gap-2 text-[9px] uppercase tracking-widest font-bold">
                        Email
                      </a>
                    )}
                    {venueProfile.websiteUrl && (
                      <a href={venueProfile.websiteUrl} target="_blank" rel="noopener noreferrer" className="bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors px-3 py-1 flex items-center justify-center gap-2 text-[9px] uppercase tracking-widest font-bold">
                        Web
                      </a>
                    )}
                    {venueProfile.instagramUrl && (
                      <a href={venueProfile.instagramUrl} target="_blank" rel="noopener noreferrer" className="bg-[#E1306C]/20 text-[#E1306C] border border-[#E1306C]/50 hover:bg-[#E1306C] hover:text-white transition-colors px-3 py-1 flex items-center justify-center gap-2 text-[9px] uppercase tracking-widest font-bold">
                        Instagram
                      </a>
                    )}
                  </div>
                </div>
              )}

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
