import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase/firebase';
import { query, where, getDocs, collection, doc, getDoc, addDoc } from 'firebase/firestore';
import type { LandingConfig } from '../../types/landing';
import type { MusicianProfile, SonaEvent } from '../../types';
import { LoadingScreen } from '../../components/shared/LoadingScreen';
import { motion, useScroll } from 'framer-motion';
import { FaInstagram, FaWhatsapp, FaEnvelope, FaYoutube, FaSpotify } from 'react-icons/fa';
import { useEvents } from '../../hooks/useEvents';

export const PublicLanding = () => {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [config, setConfig] = useState<LandingConfig | null>(null);
  const [profile, setProfile] = useState<MusicianProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    eventType: 'Boda / Evento Privado',
    details: '',
  });
  const [bookingStatus, setBookingStatus] = useState<'idle'|'submitting'|'success'|'error'>('idle');

  const { events } = useEvents(false); // fetch all published events

  const { scrollY } = useScroll();

  useEffect(() => {
    const fetchLandingData = async () => {
      if (!subdomain) return;
      
      try {
        const q = query(
          collection(db, 'public_landings'),
          where('subdomain', '==', subdomain.toLowerCase())
        );
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError(true);
          return;
        }

        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data() as LandingConfig;
        
        if (!data.isActive) {
          setError(true);
          return;
        }

        setConfig(data);
        const musId = docSnap.id;
        
        // Fetch Musician EPK Profile for Contact Info
        const profileRef = doc(db, 'users', musId);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const pData = profileSnap.data();
          setProfile({
             ...pData,
             id: musId,
             contactWhatsapp: pData.phone || pData.contactWhatsapp || '',
             instagramUrl: pData.instagramUrl || '',
             contactEmail: pData.contactEmail || ''
          } as MusicianProfile);
        }

      } catch (err) {
        console.error("Error fetching landing config:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLandingData();
  }, [subdomain]);

  if (loading) return <LoadingScreen />;
  if (error || !config) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center p-4 text-center font-sans">
        <div>
          <h1 className="text-4xl font-light mb-4 tracking-tight">Página no encontrada</h1>
          <p className="text-gray-500 mb-8 font-light">Este artista no tiene una página pública activa.</p>
          <a href="/" className="border-b border-black pb-1 hover:text-gray-500 hover:border-gray-500 transition-colors">
            Volver a Sona Empordà
          </a>
        </div>
      </div>
    );
  }

  const isDark = config.design.theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-black';
  const bgColor = isDark ? 'bg-black' : 'bg-white';
  const borderColor = isDark ? 'border-white/20' : 'border-black/20';
  const inputBorder = isDark ? 'border-white' : 'border-black';
  const btnHover = isDark ? 'hover:bg-white hover:text-black' : 'hover:bg-black hover:text-white';

  const fontClass = config.design.typography === 'serif' ? 'font-serif' : 
                    config.design.typography === 'mono' ? 'font-mono' : 'font-sans';

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, targetId: string) => {
    e.preventDefault();
    if (targetId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const elem = document.getElementById(targetId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setBookingStatus('submitting');
    try {
      const eventData = {
        title: `Contratación: ${bookingForm.eventType}`,
        date: bookingForm.date,
        time: bookingForm.time,
        location: 'A convenir',
        description: 'Solicitud de contratación externa',
        venueId: 'external_booking',
        venueName: bookingForm.name,
        musicianId: profile.id,
        musicianName: profile.stageName,
        type: 'external_booking',
        status: 'pending_musician',
        externalContact: {
          name: bookingForm.name,
          email: bookingForm.email,
          phone: bookingForm.phone,
          type: bookingForm.eventType,
          details: bookingForm.details
        },
        depositRequested: false,
        depositAmount: 0,
        paymentStatus: 'not_required'
      };
      
      await addDoc(collection(db, 'events'), eventData);
      setBookingStatus('success');
      setBookingForm({ name: '', email: '', phone: '', date: '', time: '', eventType: 'Boda / Evento Privado', details: '' });
      setTimeout(() => setBookingStatus('idle'), 5000);
    } catch (err) {
      console.error(err);
      setBookingStatus('error');
    }
  };

  // Parse Youtube ID
  const parseYoutubeId = (input: string) => {
    if (!input) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = input.match(regExp);
    return (match && match[2].length === 11) ? match[2] : input;
  };
  const ytIds = (config.modules.youtubeVideoIds || [config.modules.youtubeVideoId]).filter(Boolean).map(parseYoutubeId).filter(Boolean);

  // Parse Spotify URL
  const parseSpotifyUrl = (input: string) => {
    if (!input) return null;
    if (input.includes('/embed/')) return input;
    // e.g. https://open.spotify.com/intl-es/artist/6eUKZXaKkcviH0Ku9w2n3V
    const match = input.match(/(track|artist|album|playlist)\/([a-zA-Z0-9]+)/);
    if (match) {
      return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
    }
    return input; // fallback
  };
  const spotifyUrl = parseSpotifyUrl(config.modules.spotifyEmbedUrl);

  // Parse Instagram URL
  const getCleanInstagramUrl = (inputUrl?: string, usernameFallback?: string) => {
    let raw = inputUrl || usernameFallback || '';
    if (!raw) return '';
    
    // Split by / and get the last non-empty segment (ignores query params)
    const parts = raw.split('?')[0].split('/').filter(Boolean);
    const handle = parts[parts.length - 1];
    
    if (handle && !handle.includes('instagram.com')) {
      return `https://instagram.com/${handle}`;
    }
    return raw;
  };
  const instagramLink = getCleanInstagramUrl(profile?.instagramUrl, config.modules.instagramUsername);

  // Filter events for this band (All events, newest to oldest)
  const bandEvents = events
    .filter(e => 
      e.musicianId === profile?.id && 
      (e.status === 'published' || e.status === 'confirmed')
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} ${fontClass} overflow-x-hidden selection:bg-gray-500/30 scroll-smooth`}>
      {/* Navbar Minimalista */}
      <motion.nav 
        style={{ backgroundColor: isDark ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)' }}
        className="fixed top-0 w-full z-50 transition-colors duration-500"
      >
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <a 
            href="#top" 
            onClick={(e) => handleScroll(e, 'top')} 
            className="text-sm font-light tracking-[0.2em] uppercase mix-blend-difference text-white"
          >
            {config.hero.title}
          </a>
          <div className="hidden md:flex items-center gap-8 mix-blend-difference text-white">
            {config.hero.biography && (
              <a href="#about" onClick={(e) => handleScroll(e, 'about')} className="text-xs tracking-[0.2em] uppercase hover:opacity-50 transition-opacity">Acerca Nuestro</a>
            )}
            {(config.modules.showSpotify || config.modules.showYoutube) && (
              <a href="#music" onClick={(e) => handleScroll(e, 'music')} className="text-xs tracking-[0.2em] uppercase hover:opacity-50 transition-opacity">Música</a>
            )}
            {config.modules.showLiveDates && (
              <a href="#live" onClick={(e) => handleScroll(e, 'live')} className="text-xs tracking-[0.2em] uppercase hover:opacity-50 transition-opacity">Directos</a>
            )}
            {config.modules.showBookingWidget && (
              <a href="#booking" onClick={(e) => handleScroll(e, 'booking')} className="text-xs tracking-[0.2em] uppercase hover:opacity-50 transition-opacity">Contratación</a>
            )}
            <a href="#contact" onClick={(e) => handleScroll(e, 'contact')} className="text-xs tracking-[0.2em] uppercase hover:opacity-50 transition-opacity">Contacto</a>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section id="top" className="relative min-h-screen flex items-center justify-center pt-24 pb-12 px-6">
        {config.images.heroBackgroundUrl && (
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${config.images.heroBackgroundUrl})` }}
          >
            <div className={`absolute inset-0 ${isDark ? 'bg-black/30' : 'bg-white/20'}`}></div>
          </div>
        )}
        
        <div className="relative z-10 w-full max-w-4xl mx-auto text-center mt-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-6xl md:text-8xl lg:text-9xl font-thin tracking-tighter leading-none mb-6"
          >
            <span className={config.images.heroBackgroundUrl ? 'text-white' : textColor}>
              {config.hero.title}
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className={`text-xl md:text-2xl font-light tracking-wide mb-16 ${config.images.heroBackgroundUrl ? 'text-white/90' : 'opacity-80'}`}
          >
            {config.hero.subtitle}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1, ease: "easeOut" }}
          >
            <a 
              href={`#${config.hero.ctaTarget}`}
              onClick={(e) => handleScroll(e, config.hero.ctaTarget)}
              className={`inline-block border px-8 py-4 text-xs tracking-[0.3em] uppercase transition-all duration-300 ${config.images.heroBackgroundUrl ? 'border-white text-white hover:bg-white hover:text-black' : `border-current ${btnHover}`}`}
            >
              {config.hero.ctaText}
            </a>
          </motion.div>
        </div>
      </section>

      {/* Biography Section */}
      {config.hero.biography && (
        <section id="about" className={`py-32 px-6 flex items-center justify-center ${bgColor}`}>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-2xl md:text-4xl font-light leading-relaxed tracking-wide">
              {config.hero.biography}
            </p>
            {instagramLink && (
              <div className="mt-12 flex justify-center">
                <a href={instagramLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 hover:opacity-70 transition-transform hover:scale-105">
                  <span className="font-light tracking-[0.2em] uppercase text-sm">Instagram</span>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/9/95/Instagram_logo_2022.svg" alt="Instagram" className="w-8 h-8" />
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Music Section (Horizontal Scroll Gallery) */}
      {(config.modules.showSpotify || config.modules.showYoutube) && (
        <section id="music" className={`relative min-h-screen flex flex-col items-center justify-center py-32`}>
          {config.images.musicBackgroundUrl && (
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat fixed-bg"
              style={{ backgroundImage: `url(${config.images.musicBackgroundUrl})` }}
            >
              <div className={`absolute inset-0 ${isDark ? 'bg-black/80' : 'bg-white/80'}`}></div>
            </div>
          )}
          
          <div className="relative z-10 w-full max-w-7xl mx-auto">
            <h2 className="text-sm tracking-[0.4em] uppercase mb-20 text-center opacity-100 font-medium text-current">Escucha</h2>
            
            <div className="flex flex-col gap-24 items-center w-full px-6 md:px-12">
              
              {/* Youtube Grid */}
              {config.modules.showYoutube && ytIds.length > 0 && (
                <div className="w-full">
                  <FaYoutube className="text-[#FF0000] w-12 h-12 mx-auto mb-10 opacity-80 hover:opacity-100 transition-opacity" />
                  <div className={`grid gap-12 ${ytIds.length === 1 ? 'grid-cols-1 max-w-4xl mx-auto' : 'grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto'}`}>
                    {ytIds.map((id, index) => (
                      <div key={`yt-${index}`} className="w-full transition-all duration-700 grayscale hover:grayscale-0">
                        <div className="w-full aspect-video">
                          <iframe 
                            width="100%" 
                            height="100%" 
                            src={`https://www.youtube.com/embed/${id}?vq=hd1080&rel=0&modestbranding=1`} 
                            title="YouTube video" 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                            className="w-full h-full shadow-2xl"
                          ></iframe>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spotify */}
              {config.modules.showSpotify && spotifyUrl && (
                <div className="w-full max-w-3xl mx-auto mt-8 border-t border-current/20 pt-24">
                  <FaSpotify className="text-[#1DB954] w-12 h-12 mx-auto mb-10 opacity-80 hover:opacity-100 transition-opacity" />
                  <iframe 
                    className="rounded-none w-full shadow-2xl grayscale hover:grayscale-0 transition-all duration-700" 
                    src={spotifyUrl}
                    width="100%" 
                    height="352" 
                    frameBorder="0" 
                    allowFullScreen 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy"
                  ></iframe>
                </div>
              )}

            </div>
          </div>
        </section>
      )}

      {/* Live Dates Section */}
      {config.modules.showLiveDates && (
        <section id="live" className={`relative min-h-screen flex flex-col items-center justify-center py-32 px-6`}>
           {config.images.liveBackgroundUrl && (
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat fixed-bg"
              style={{ backgroundImage: `url(${config.images.liveBackgroundUrl})` }}
            >
              <div className={`absolute inset-0 ${isDark ? 'bg-black/90' : 'bg-white/90'}`}></div>
            </div>
          )}
          <div className="relative z-10 w-full max-w-3xl mx-auto">
            <h2 className="text-xs tracking-[0.4em] uppercase mb-16 text-center opacity-70">Directos</h2>
            
            <div className="space-y-0 border-t border-b border-current opacity-80 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {bandEvents.length > 0 ? (
                bandEvents.map((ev) => (
                  <a 
                    href={`/event/${ev.id}`} 
                    target="_blank" 
                    rel="noreferrer"
                    key={ev.id} 
                    className="flex justify-between py-8 border-b border-current group hover:opacity-50 transition-opacity cursor-pointer block"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-12 w-full">
                      <span className="text-sm tracking-widest font-light w-32 uppercase">
                        {new Date(ev.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </span>
                      <span className="text-2xl font-light">{ev.title}</span>
                      <span className="text-sm font-light opacity-50 md:ml-auto">{ev.venueName}</span>
                    </div>
                  </a>
                ))
              ) : (
                <div className="py-12 text-center text-sm font-light opacity-50 tracking-widest uppercase">
                  No hay fechas confirmadas próximamente.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Booking Section */}
      {config.modules.showBookingWidget && (
        <section id="booking" className={`relative min-h-screen flex flex-col items-center justify-center py-32 px-6`}>
          {config.images.contactBackgroundUrl && (
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat fixed-bg"
              style={{ backgroundImage: `url(${config.images.contactBackgroundUrl})` }}
            >
              <div className={`absolute inset-0 ${isDark ? 'bg-black/90' : 'bg-white/90'}`}></div>
            </div>
          )}
          
          <div className="relative z-10 w-full max-w-xl mx-auto">
            <h2 className="text-xs tracking-[0.4em] uppercase mb-16 text-center opacity-70">Contacto</h2>
            
            <form onSubmit={handleBookingSubmit} className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <input 
                  type="text" 
                  required
                  value={bookingForm.name}
                  onChange={e => setBookingForm({...bookingForm, name: e.target.value})}
                  placeholder="Tu Nombre o Empresa" 
                  className={`w-full bg-transparent border-0 border-b border-${inputBorder}/30 py-4 px-0 focus:ring-0 focus:border-${inputBorder} transition-colors font-light text-lg placeholder:font-light placeholder:text-${textColor}/30 outline-none`}
                />
                <input 
                  type="email" 
                  required
                  value={bookingForm.email}
                  onChange={e => setBookingForm({...bookingForm, email: e.target.value})}
                  placeholder="Email de contacto" 
                  className={`w-full bg-transparent border-0 border-b border-${inputBorder}/30 py-4 px-0 focus:ring-0 focus:border-${inputBorder} transition-colors font-light text-lg placeholder:font-light placeholder:text-${textColor}/30 outline-none`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <input 
                  type="tel" 
                  value={bookingForm.phone}
                  onChange={e => setBookingForm({...bookingForm, phone: e.target.value})}
                  placeholder="Teléfono (opcional)" 
                  className={`w-full bg-transparent border-0 border-b border-${inputBorder}/30 py-4 px-0 focus:ring-0 focus:border-${inputBorder} transition-colors font-light text-lg placeholder:font-light placeholder:text-${textColor}/30 outline-none`}
                />
                <select 
                  value={bookingForm.eventType}
                  onChange={e => setBookingForm({...bookingForm, eventType: e.target.value})}
                  className={`w-full bg-transparent border-0 border-b border-${inputBorder}/30 py-4 px-0 focus:ring-0 focus:border-${inputBorder} transition-colors font-light text-lg outline-none appearance-none cursor-pointer`}
                  style={{ color: 'inherit' }}
                >
                  <option value="Boda / Evento Privado" className="text-black">Boda / Evento Privado</option>
                  <option value="Evento Corporativo" className="text-black">Evento Corporativo</option>
                  <option value="Fiesta Mayor / Ayuntamiento" className="text-black">Fiesta Mayor / Ayuntamiento</option>
                  <option value="Festival" className="text-black">Festival</option>
                  <option value="Otro" className="text-black">Otro</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <input 
                  type="date" 
                  required
                  value={bookingForm.date}
                  onChange={e => setBookingForm({...bookingForm, date: e.target.value})}
                  className={`w-full bg-transparent border-0 border-b border-${inputBorder}/30 py-4 px-0 focus:ring-0 focus:border-${inputBorder} transition-colors font-light text-lg placeholder:font-light outline-none`}
                  style={{ colorScheme: isDark ? 'dark' : 'light' }}
                />
                <input 
                  type="time" 
                  value={bookingForm.time}
                  onChange={e => setBookingForm({...bookingForm, time: e.target.value})}
                  className={`w-full bg-transparent border-0 border-b border-${inputBorder}/30 py-4 px-0 focus:ring-0 focus:border-${inputBorder} transition-colors font-light text-lg placeholder:font-light outline-none`}
                  style={{ colorScheme: isDark ? 'dark' : 'light' }}
                />
              </div>
              <div>
                <textarea 
                  required
                  value={bookingForm.details}
                  onChange={e => setBookingForm({...bookingForm, details: e.target.value})}
                  placeholder="Detalles del evento (lugar, presupuesto aproximado, dudas...)" 
                  rows={4}
                  className={`w-full bg-transparent border-0 border-b border-${inputBorder}/30 py-4 px-0 focus:ring-0 focus:border-${inputBorder} transition-colors font-light text-lg resize-none placeholder:font-light placeholder:text-${textColor}/30 outline-none`}
                ></textarea>
              </div>
              <div className="pt-8 text-center h-20">
                {bookingStatus === 'success' ? (
                  <p className="text-green-500 font-light text-lg animate-pulse">¡Petición enviada correctamente! Nos pondremos en contacto contigo.</p>
                ) : bookingStatus === 'error' ? (
                  <p className="text-red-500 font-light text-lg">Hubo un error al enviar la petición. Inténtalo de nuevo.</p>
                ) : (
                  <button 
                    type="submit" 
                    disabled={bookingStatus === 'submitting'}
                    className={`border border-current px-12 py-4 text-xs tracking-[0.3em] uppercase transition-all duration-300 ${btnHover} ${bookingStatus === 'submitting' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {bookingStatus === 'submitting' ? 'Enviando...' : 'Enviar Petición'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Contact Section & Footer */}
      <footer id="contact" className={`pt-24 pb-12 px-6 flex flex-col items-center gap-12 relative z-10 ${bgColor} border-t border-current/20`}>
        <div className="text-center space-y-4 opacity-90 max-w-lg">
          <h2 className="text-xs tracking-[0.4em] uppercase mb-8 opacity-70">Contacto</h2>
          
          {profile?.baseLocation && (
            <p className="font-light tracking-wider text-lg">{profile.baseLocation}</p>
          )}
          {profile?.contactEmail && (
            <p className="font-light tracking-wide text-lg">
              <a href={`mailto:${profile.contactEmail}`} className="hover:opacity-70 transition-opacity">{profile.contactEmail}</a>
            </p>
          )}
          {profile?.contactPhone && (
            <p className="font-light tracking-widest text-lg">
              <a href={`tel:${profile.contactPhone}`} className="hover:opacity-70 transition-opacity">{profile.contactPhone}</a>
            </p>
          )}
        </div>

        <div className="flex gap-10 items-center mt-4">
          {instagramLink && (
            <a href={instagramLink} target="_blank" rel="noreferrer" className="hover:opacity-70 transition-transform hover:scale-110">
              <img src="https://upload.wikimedia.org/wikipedia/commons/9/95/Instagram_logo_2022.svg" alt="Instagram" className="w-8 h-8" />
            </a>
          )}
          {profile?.contactWhatsapp && (
            <a href={`https://wa.me/${profile.contactWhatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="hover:opacity-70 transition-transform hover:scale-110">
              <FaWhatsapp className="w-8 h-8 text-[#25D366]" />
            </a>
          )}
        </div>

        <div className="mt-16 text-center">
          <p className="text-[10px] tracking-widest uppercase opacity-40">
            Powered by Sona Empordà
          </p>
        </div>
      </footer>
    </div>
  );
};
