import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { query, where, getDocs, collection, doc, getDoc, addDoc } from 'firebase/firestore';
import type { LandingConfig } from '../../types/landing';
import type { MusicianProfile, SonaEvent } from '../../types';
import { LoadingScreen } from '../../components/shared/LoadingScreen';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FaInstagram, FaWhatsapp, FaEnvelope, FaYoutube, FaSpotify, FaBars, FaTimes, FaLock, FaChevronLeft, FaChevronRight, FaExclamationCircle, FaPlay } from 'react-icons/fa';

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30',
  '00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30',
  '04:00'
];

const isPrivateEvent = (e: any) => {
  if (!e) return false;
  return (
    e.type === 'private' ||
    e.type === 'external_booking' ||
    e.venueId === 'external_booking' ||
    e.isPrivate === true ||
    (typeof e.title === 'string' && (
      e.title.toLowerCase().startsWith('contratación:') ||
      e.title.toLowerCase().includes('evento privado')
    ))
  );
};

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
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Estados para la sección multimedia (audio / vídeo)
  const [activeMediaTab, setActiveMediaTab] = useState<'spotify' | 'youtube'>('youtube');
  const [cinemaVideoIndex, setCinemaVideoIndex] = useState<number | null>(null);

  // Estados y refs para navegación horizontal en pantalla completa
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const lastWheelTime = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);

  const [bandEvents, setBandEvents] = useState<SonaEvent[]>([]);

  const { scrollY } = useScroll();

  useEffect(() => {
    let isCancelled = false;

    const fetchLandingData = async () => {
      if (!subdomain) return;
      const cleanSubdomain = subdomain.toLowerCase();
      const cacheKey = `sona_landing_${cleanSubdomain}`;

      // 1. Restauración instantánea desde caché local (Stale-While-Revalidate)
      try {
        const cachedRaw = sessionStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached.config) {
            setConfig(cached.config);
            if (cached.profile) setProfile(cached.profile);
            if (cached.events) setBandEvents(cached.events);
            setLoading(false);
          }
        }
      } catch (e) {
        // Ignorar fallos de parsing de caché
      }

      try {
        const q = query(
          collection(db, 'public_landings'),
          where('subdomain', '==', cleanSubdomain)
        );
        const querySnapshot = await getDocs(q);

        if (isCancelled) return;

        if (querySnapshot.empty) {
          setError(true);
          setLoading(false);
          return;
        }

        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data() as LandingConfig;

        if (!data.isActive) {
          setError(true);
          setLoading(false);
          return;
        }

        // Renderizado del Hero y diseño en cuanto llega la config
        setConfig(data);
        setLoading(false);

        const musId = docSnap.id;

        // 2. Cargar Perfil y Eventos en paralelo (sólo los de este músico en particular)
        const profilePromise = getDoc(doc(db, 'users', musId)).catch(err => {
          console.warn("Error fetching profile:", err);
          return null;
        });

        const eventsPromise = (data.modules?.showLiveDates || data.modules?.showBookingWidget)
          ? getDocs(query(collection(db, 'events'), where('musicianId', '==', musId))).catch(err => {
            console.warn("Error fetching musician events:", err);
            return null;
          })
          : Promise.resolve(null);

        const [profileSnap, eventsSnap] = await Promise.all([profilePromise, eventsPromise]);
        if (isCancelled) return;

        let resolvedProfile: MusicianProfile | null = null;
        if (profileSnap && profileSnap.exists()) {
          const pData = profileSnap.data();
          resolvedProfile = {
            ...pData,
            id: musId,
            contactWhatsapp: pData.contactWhatsapp ? String(pData.contactWhatsapp) : (pData.phone ? String(pData.phone) : ''),
            contactPhone: pData.contactPhone ? String(pData.contactPhone) : (pData.phone ? String(pData.phone) : ''),
            instagramUrl: pData.instagramUrl || '',
            contactEmail: pData.contactEmail || ''
          } as MusicianProfile;
          setProfile(resolvedProfile);
        }

        let resolvedEvents: SonaEvent[] = [];
        if (eventsSnap && !eventsSnap.empty) {
          resolvedEvents = eventsSnap.docs
            .map(d => {
              const evData = d.data();
              // Normalizar fecha si viene de Firestore Timestamp
              let dateStr = evData.date;
              if (dateStr && typeof dateStr.toDate === 'function') {
                dateStr = dateStr.toDate().toISOString();
              }
              return { id: d.id, ...evData, date: dateStr } as SonaEvent;
            })
            .filter(e => e.status === 'published' || e.status === 'confirmed')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setBandEvents(resolvedEvents);
        }

        // Guardar en caché para la próxima visita inmediata
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            config: data,
            profile: resolvedProfile,
            events: resolvedEvents
          }));
        } catch (e) {
          // Ignorar si la cuota de sessionStorage se excede
        }

      } catch (err) {
        console.error("Error fetching landing config:", err);
        if (!config) {
          setError(true);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchLandingData();

    return () => {
      isCancelled = true;
    };
  }, [subdomain]);

  const isDark = config?.design?.theme === 'dark';

  const navBg = useTransform(
    scrollY,
    [0, 100],
    ['rgba(0,0,0,0)', isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)']
  );

  const navBackdrop = useTransform(
    scrollY,
    [0, 100],
    ['blur(0px)', 'blur(12px)']
  );

  // Lista ordenada de secciones activas para la barra horizontal y navegación
  const activeSections = useMemo(() => {
    if (!config) return [];
    return [
      { id: 'top', label: 'Inicio' },
      ...(config.hero.biography ? [{ id: 'about', label: 'Bio' }] : []),
      ...((config.modules.showSpotify || config.modules.showYoutube) ? [{ id: 'music', label: 'Música' }] : []),
      ...(config.modules.showLiveDates ? [{ id: 'live', label: 'Directos' }] : []),
      ...(config.modules.showBookingWidget ? [{ id: 'booking', label: 'Contratación' }] : []),
      { id: 'contact', label: 'Contacto' }
    ];
  }, [config]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const isDateUnavailable = useMemo(() => {
    if (!bookingForm.date) return false;

    // 1. Revisar estado manual en el calendario del músico
    const calStatus = profile?.calendar?.[bookingForm.date];
    if (calStatus === 'unavailable' || calStatus === 'booked' || calStatus === 'booked_full') {
      return true;
    }

    // 2. Revisar si ya tiene eventos confirmados o publicados este día
    const hasEvent = bandEvents.some(e => {
      const d = e.date ? (typeof e.date === 'string' ? e.date.split('T')[0] : '') : '';
      return d === bookingForm.date && (e.status === 'confirmed' || e.status === 'published');
    });

    return hasEvent;
  }, [bookingForm.date, profile?.calendar, bandEvents]);

  // Solo los conciertos públicos deben aparecer en la sección de Directos de la web del músico
  const publicLiveEvents = useMemo(() => {
    return bandEvents.filter(e => !isPrivateEvent(e));
  }, [bandEvents]);

  // Parse Youtube IDs
  const ytIds = useMemo(() => {
    if (!config?.modules) return [];
    const parseYoutubeId = (input: string) => {
      if (!input) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = input.match(regExp);
      return (match && match[2].length === 11) ? match[2] : input;
    };
    const rawIds = config.modules.youtubeVideoIds || [config.modules.youtubeVideoId];
    return rawIds.filter(Boolean).map(parseYoutubeId).filter(Boolean) as string[];
  }, [config?.modules?.youtubeVideoIds, config?.modules?.youtubeVideoId]);

  // Control de teclado para el visor de cine (Escape para cerrar, Flechas para cambiar de vídeo)
  useEffect(() => {
    if (cinemaVideoIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCinemaVideoIndex(null);
      } else if (e.key === 'ArrowLeft' && ytIds.length > 1) {
        setCinemaVideoIndex(prev => (prev !== null && prev > 0 ? prev - 1 : ytIds.length - 1));
      } else if (e.key === 'ArrowRight' && ytIds.length > 1) {
        setCinemaVideoIndex(prev => (prev !== null && prev < ytIds.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cinemaVideoIndex, ytIds.length]);

  // Transición suave entre pantallas en modo horizontal
  const goToSectionIndex = (index: number) => {
    if (index < 0 || index >= activeSections.length) return;
    const track = document.getElementById('horizontal-track');
    if (!track) return;
    const targetX = index * track.clientWidth;
    track.scrollTo({ left: targetX, behavior: 'smooth' });
    setCurrentSectionIndex(index);
  };

  // Navegación fluida en Desktop para modo Horizontal (Rueda de ratón, Teclas Flecha)
  useEffect(() => {
    if (!config || config.design.layout !== 'horizontal') return;

    const handleWheel = (e: WheelEvent) => {
      if (window.innerWidth < 768) return;

      const track = document.getElementById('horizontal-track');
      if (!track) return;

      // Si el cursor está en un elemento interno con scroll vertical (ej: lista de conciertos), respetarlo
      const target = e.target as HTMLElement;
      const scrollableChild = target?.closest('.custom-scrollbar, .overflow-y-auto') as HTMLElement | null;

      if (scrollableChild && scrollableChild !== track) {
        const isAtTop = scrollableChild.scrollTop <= 0;
        const isAtBottom = Math.abs(scrollableChild.scrollHeight - scrollableChild.clientHeight - scrollableChild.scrollTop) < 2;

        if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom)) {
          return; // Permitir scroll vertical dentro del elemento
        }
      }

      e.preventDefault();

      const now = Date.now();
      if (now - lastWheelTime.current < 450) return; // Cooldown para salto suave pantalla por pantalla

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta > 20) {
        lastWheelTime.current = now;
        setCurrentSectionIndex((prev) => {
          const next = Math.min(prev + 1, activeSections.length - 1);
          goToSectionIndex(next);
          return next;
        });
      } else if (delta < -20) {
        lastWheelTime.current = now;
        setCurrentSectionIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          goToSectionIndex(next);
          return next;
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (window.innerWidth < 768) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentSectionIndex((prev) => {
          const next = Math.min(prev + 1, activeSections.length - 1);
          goToSectionIndex(next);
          return next;
        });
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSectionIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          goToSectionIndex(next);
          return next;
        });
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [config, activeSections]);

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

  const textColor = isDark ? 'text-white' : 'text-black';
  const bgColor = isDark ? 'bg-black' : 'bg-white';
  const borderColor = isDark ? 'border-white/20' : 'border-black/20';
  const inputBorder = isDark ? 'border-white' : 'border-black';
  const btnHover = isDark ? 'hover:bg-white hover:text-black' : 'hover:bg-black hover:text-white';

  const fontClass = config.design.typography === 'serif' ? 'font-serif' :
    config.design.typography === 'mono' ? 'font-mono' : 'font-sans';

  const isHorizontalLayout = config.design.layout === 'horizontal';

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (isHorizontalLayout && window.innerWidth >= 768) {
      const targetIdx = activeSections.findIndex(s => s.id === targetId);
      if (targetIdx !== -1) {
        goToSectionIndex(targetIdx);
        return;
      }
    }

    if (targetId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const elem = document.getElementById(targetId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Soporte para arrastrar libremente con el cursor del ratón (Drag to Scroll)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isHorizontalLayout || window.innerWidth < 768) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, iframe, .custom-scrollbar')) return;

    isDraggingRef.current = true;
    dragStartXRef.current = e.pageX;
    const track = document.getElementById('horizontal-track');
    dragStartScrollLeftRef.current = track ? track.scrollLeft : 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const track = document.getElementById('horizontal-track');
    if (!track) return;
    e.preventDefault();
    const walk = (e.pageX - dragStartXRef.current) * 1.3;
    track.scrollLeft = dragStartScrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const track = document.getElementById('horizontal-track');
    if (!track) return;
    const targetIdx = Math.round(track.scrollLeft / track.clientWidth);
    goToSectionIndex(targetIdx);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    if (isDateUnavailable) {
      alert('El grupo no está disponible para esta fecha. Por favor, selecciona otro día.');
      return;
    }
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
        isPrivate: true,
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

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const userEmail = (profile as any)?.email || profile?.contactEmail;
    if (!userEmail || !password) {
      setLoginError('No se encontró email para este usuario.');
      return;
    }
    setIsLoggingIn(true);
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, userEmail, password);
      setIsLoginModalOpen(false);
      navigate('/musician');
    } catch (err: any) {
      console.error(err);
      setLoginError('Contraseña incorrecta');
    } finally {
      setIsLoggingIn(false);
    }
  };

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



  return (
    <div className={`min-h-screen ${bgColor} ${textColor} ${fontClass} ${isHorizontalLayout ? 'overflow-y-hidden md:overflow-x-hidden' : 'overflow-x-hidden'} selection:bg-gray-500/30 scroll-smooth`}>
      {/* Navbar Minimalista */}
      <motion.nav
        style={{ backgroundColor: navBg, backdropFilter: navBackdrop, WebkitBackdropFilter: navBackdrop }}
        className="fixed top-0 w-full z-50"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 md:h-24 flex items-center justify-between relative z-50">
          <a
            href="#top"
            onClick={(e) => handleScroll(e, 'top')}
            className="text-sm font-light tracking-[0.2em] uppercase mix-blend-difference text-white relative z-50"
          >
            {config.hero.title}
          </a>

          {/* Hamburger Menu Icon */}
          <button
            className="md:hidden mix-blend-difference text-white z-50 p-2"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 mix-blend-difference text-white">
            {config.hero.biography && (
              <a href="#about" onClick={(e) => handleScroll(e, 'about')} className="text-base font-bold tracking-[0.3em] uppercase hover:opacity-50 transition-opacity">Acerca Nuestro</a>
            )}
            {(config.modules.showSpotify || config.modules.showYoutube) && (
              <a href="#music" onClick={(e) => handleScroll(e, 'music')} className="text-base font-bold tracking-[0.3em] uppercase hover:opacity-50 transition-opacity">Música</a>
            )}
            {config.modules.showLiveDates && (
              <a href="#live" onClick={(e) => handleScroll(e, 'live')} className="text-base font-bold tracking-[0.3em] uppercase hover:opacity-50 transition-opacity">Directos</a>
            )}
            {config.modules.showBookingWidget && (
              <a href="#booking" onClick={(e) => handleScroll(e, 'booking')} className="text-base font-bold tracking-[0.3em] uppercase hover:opacity-50 transition-opacity">Contratación</a>
            )}
            <a href="#contact" onClick={(e) => handleScroll(e, 'contact')} className="text-base font-bold tracking-[0.3em] uppercase hover:opacity-50 transition-opacity">Contacto</a>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`absolute top-16 right-0 w-full flex flex-col items-end px-6 py-2 gap-4 transition-all duration-300 origin-top-right z-50 md:hidden mix-blend-difference text-white ${isMobileMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
        >
          {config.hero.biography && (
            <a href="#about" onClick={(e) => handleScroll(e, 'about')} className="text-xl font-black tracking-[0.3em] uppercase hover:opacity-50 transition-opacity">Acerca Nuestro</a>
          )}
          {(config.modules.showSpotify || config.modules.showYoutube) && (
            <a href="#music" onClick={(e) => handleScroll(e, 'music')} className="text-xl font-black tracking-[0.3em] uppercase hover:opacity-50 transition-opacity">Música</a>
          )}
          {config.modules.showLiveDates && (
            <a href="#live" onClick={(e) => handleScroll(e, 'live')} className="text-xl font-black tracking-[0.3em] uppercase hover:opacity-50 transition-opacity">Directos</a>
          )}
          <a href="#contact" onClick={(e) => handleScroll(e, 'contact')} className="text-xl font-black tracking-[0.3em] uppercase hover:opacity-50 transition-opacity">Contacto</a>
        </div>
      </motion.nav>

      {/* Contenedor Principal: Vertical tradicional o Pista Horizontal Editorial en Desktop */}
      <div
        id="horizontal-track"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={
          isHorizontalLayout
            ? "md:flex md:flex-row md:overflow-x-hidden md:h-screen md:w-screen scroll-smooth cursor-grab active:cursor-grabbing select-none"
            : "flex flex-col"
        }
      >
        {/* Hero Section (Ocupa la pantalla completa inicial 100vw) */}
        <section
          id="top"
          className={`relative min-h-screen flex items-center justify-center pt-24 pb-12 px-6 overflow-hidden ${isHorizontalLayout
              ? "md:w-screen md:min-w-[100vw] md:h-screen md:shrink-0 md:border-r md:border-white/10 md:pb-32"
              : "w-full"
            }`}
        >
          {isHorizontalLayout && (
            <>
              <div className={`hidden md:block pointer-events-none absolute inset-y-0 left-0 w-28 lg:w-40 z-20 ${isDark ? 'bg-gradient-to-r from-black/80 to-transparent' : 'bg-gradient-to-r from-white/80 to-transparent'}`} />
              <div className={`hidden md:block pointer-events-none absolute inset-y-0 right-0 w-28 lg:w-40 z-20 ${isDark ? 'bg-gradient-to-l from-black/80 to-transparent' : 'bg-gradient-to-l from-white/80 to-transparent'}`} />
            </>
          )}
          {config.images.heroBackgroundUrl && (
            <div
              className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${config.images.heroBackgroundUrl})` }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: isDark
                    ? `rgba(0, 0, 0, ${(config.images.heroOverlayOpacity ?? 30) / 100})`
                    : `rgba(255, 255, 255, ${(config.images.heroOverlayOpacity ?? 20) / 100})`
                }}
              ></div>
            </div>
          )}

          <div className="relative z-10 w-full max-w-4xl mx-auto text-center mt-32">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-6xl md:text-8xl lg:text-9xl font-thin tracking-tighter leading-none mb-4"
            >
              <span className={config.images.heroBackgroundUrl ? 'text-white' : textColor}>
                {config.hero.title}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              className={`text-xl md:text-2xl font-light tracking-wide mb-8 ${config.images.heroBackgroundUrl ? 'text-white/90' : 'opacity-80'}`}
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
          <section
            id="about"
            className={`scroll-mt-24 py-32 px-8 flex items-center justify-center relative overflow-hidden ${bgColor} ${isHorizontalLayout
                ? "md:w-screen md:min-w-[100vw] md:h-screen md:shrink-0 md:border-r md:border-white/10 md:pb-32"
                : "w-full"
              }`}
          >
            {isHorizontalLayout && (
              <>
                <div className={`hidden md:block pointer-events-none absolute inset-y-0 left-0 w-28 lg:w-40 z-20 ${isDark ? 'bg-gradient-to-r from-black/80 to-transparent' : 'bg-gradient-to-r from-white/80 to-transparent'}`} />
                <div className={`hidden md:block pointer-events-none absolute inset-y-0 right-0 w-28 lg:w-40 z-20 ${isDark ? 'bg-gradient-to-l from-black/80 to-transparent' : 'bg-gradient-to-l from-white/80 to-transparent'}`} />
              </>
            )}
            <div className={`max-w-2xl mx-auto text-center ${isHorizontalLayout ? 'p-10 md:p-14 rounded-3xl bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10' : ''}`}>
              <h2 className="text-xs tracking-[0.4em] uppercase mb-8 opacity-70">Bio</h2>
              <p className="text-xl md:text-2xl font-light leading-relaxed tracking-wide">
                {config.hero.biography}
              </p>
              {instagramLink && (
                <div className="mt-8 flex justify-center">
                  <a href={instagramLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 hover:opacity-70 transition-transform hover:scale-105">
                    <span className="font-light tracking-[0.2em] uppercase text-xs">Instagram</span>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/9/95/Instagram_logo_2022.svg" alt="Instagram" className="w-6 h-6" />
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Music & Media Section */}
        {(config.modules.showSpotify || config.modules.showYoutube) && (
          <section
            id="music"
            className={`scroll-mt-24 relative min-h-screen flex flex-col items-center justify-center py-24 px-6 overflow-y-auto custom-scrollbar ${isHorizontalLayout
                ? "md:w-screen md:min-w-[100vw] md:h-screen md:shrink-0 md:border-r md:border-white/10 md:pb-32 md:pt-16 md:overflow-y-auto"
                : "w-full"
              }`}
          >
            {config.images.musicBackgroundUrl && (
              <div
                className={`absolute inset-0 z-0 bg-cover bg-center bg-no-repeat ${isHorizontalLayout ? '' : 'fixed-bg'}`}
                style={{ backgroundImage: `url(${config.images.musicBackgroundUrl})` }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: isDark
                      ? `rgba(0, 0, 0, ${(config.images.musicOverlayOpacity ?? 65) / 100})`
                      : `rgba(255, 255, 255, ${(config.images.musicOverlayOpacity ?? 65) / 100})`
                  }}
                ></div>
              </div>
            )}

            {isHorizontalLayout && (
              <>
                <div className={`hidden md:block pointer-events-none absolute inset-y-0 left-0 w-28 lg:w-40 z-20 ${isDark ? 'bg-gradient-to-r from-black/80 to-transparent' : 'bg-gradient-to-r from-white/80 to-transparent'}`} />
                <div className={`hidden md:block pointer-events-none absolute inset-y-0 right-0 w-28 lg:w-40 z-20 ${isDark ? 'bg-gradient-to-l from-black/80 to-transparent' : 'bg-gradient-to-l from-white/80 to-transparent'}`} />
              </>
            )}

            <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
              <h2 className="text-xs tracking-[0.4em] uppercase mb-8 text-center opacity-70">
                Música & Vídeos
              </h2>

              {/* Píldoras de selección (Audio vs Vídeo) sólo si tiene ambos */}
              {config.modules.showSpotify && spotifyUrl && config.modules.showYoutube && ytIds.length > 0 && (
                <div className="inline-flex items-center gap-1 p-1 bg-black/40 backdrop-blur-md border border-white/15 rounded-full mb-10 shadow-xl">
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab('youtube')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs uppercase tracking-widest font-semibold transition-all ${
                      activeMediaTab === 'youtube'
                        ? 'bg-white text-black shadow-md'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FaYoutube className={activeMediaTab === 'youtube' ? 'text-[#FF0000]' : 'text-white/40'} />
                    Vídeos ({ytIds.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab('spotify')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs uppercase tracking-widest font-semibold transition-all ${
                      activeMediaTab === 'spotify'
                        ? 'bg-white text-black shadow-md'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FaSpotify className={activeMediaTab === 'spotify' ? 'text-[#1DB954]' : 'text-white/40'} />
                    Audio
                  </button>
                </div>
              )}

            {/* Panel de VÍDEOS (Opción 1: Tarjetas Cinemáticas con apertura en Lightbox Sala de Cine) */}
            {config.modules.showYoutube && ytIds.length > 0 && (activeMediaTab === 'youtube' || (!config.modules.showSpotify || !spotifyUrl)) && (
              <div className="w-full flex flex-col items-center animate-in fade-in duration-300">
                <div className={`w-full ${
                  ytIds.length === 1 
                    ? 'max-w-2xl' 
                    : ytIds.length === 2 
                      ? 'grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl' 
                      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl'
                }`}>
                  {ytIds.map((id, index) => (
                    <div
                      key={`cinema-card-${id}-${index}`}
                      onClick={() => setCinemaVideoIndex(index)}
                      className="group relative aspect-video rounded-2xl overflow-hidden border border-white/15 hover:border-gold/70 shadow-2xl shadow-black/80 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-gold/10"
                    >
                      {/* Portada del vídeo en alta resolución */}
                      <img 
                        src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`} 
                        alt={`Vídeo ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Capa de atmósfera oscura elegante */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 group-hover:via-black/20 transition-colors duration-300" />

                      {/* Botón Play central con efecto luminoso */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/30 text-white flex items-center justify-center pl-1 group-hover:scale-110 group-hover:bg-gold group-hover:text-black group-hover:border-gold shadow-2xl transition-all duration-300">
                          <FaPlay className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                      </div>

                      {/* Pie de la tarjeta */}
                      <div className="absolute bottom-0 inset-x-0 p-4 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-white/20 text-[10px] uppercase tracking-widest font-mono text-gold font-semibold">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="text-white/85 font-medium tracking-wide group-hover:text-white transition-colors">
                            Ver Vídeo
                          </span>
                        </div>
                        <span className="text-[10px] tracking-widest uppercase text-white/50 group-hover:text-gold transition-colors font-semibold">
                          Sala Cine
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-center text-xs tracking-widest uppercase text-white/40 font-light">
                  Haz clic en cualquier vídeo para reproducirlo a pantalla completa
                </p>
              </div>
            )}

            {/* Panel de SPOTIFY / AUDIO (Caja Glassmorphism compacta y limpia) */}
            {config.modules.showSpotify && spotifyUrl && (activeMediaTab === 'spotify' || (!config.modules.showYoutube || ytIds.length === 0)) && (
              <div className="w-full max-w-xl mx-auto flex flex-col items-center animate-in fade-in duration-300">
                <div className="w-full bg-black/50 backdrop-blur-xl border border-white/15 p-4 sm:p-6 rounded-2xl shadow-2xl">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                    <FaSpotify className="text-[#1DB954] w-6 h-6 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-white/50 block">Música Oficial</span>
                      <h4 className="text-sm font-medium text-white">Escúchanos en Spotify</h4>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-xl bg-black/80">
                    <iframe
                      className="w-full"
                      src={spotifyUrl}
                      width="100%"
                      height="352"
                      frameBorder="0"
                      allowFullScreen
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                    ></iframe>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>
      )}

        {/* Live Dates Section */}
        {config.modules.showLiveDates && (
          <section
            id="live"
            className={`scroll-mt-24 relative min-h-screen flex flex-col items-center justify-center py-24 px-6 overflow-y-auto custom-scrollbar ${isHorizontalLayout
                ? "md:w-screen md:min-w-[100vw] md:h-screen md:shrink-0 md:border-r md:border-white/10 md:pb-32 md:pt-16 md:overflow-y-auto"
                : "w-full"
              }`}
          >
            {config.images.liveBackgroundUrl && (
              <div
                className={`absolute inset-0 z-0 bg-cover bg-center bg-no-repeat ${isHorizontalLayout ? '' : 'fixed-bg'}`}
                style={{ backgroundImage: `url(${config.images.liveBackgroundUrl})` }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: isDark
                      ? `rgba(0, 0, 0, ${(config.images.liveOverlayOpacity ?? 50) / 100})`
                      : `rgba(255, 255, 255, ${(config.images.liveOverlayOpacity ?? 50) / 100})`
                  }}
                ></div>
              </div>
            )}

            {isHorizontalLayout && (
              <>
                <div className={`hidden md:block pointer-events-none absolute inset-y-0 left-0 w-28 lg:w-40 z-20 ${isDark ? 'bg-gradient-to-r from-black/80 to-transparent' : 'bg-gradient-to-r from-white/80 to-transparent'}`} />
                <div className={`hidden md:block pointer-events-none absolute inset-y-0 right-0 w-28 lg:w-40 z-20 ${isDark ? 'bg-gradient-to-l from-black/80 to-transparent' : 'bg-gradient-to-l from-white/80 to-transparent'}`} />
              </>
            )}

            <div className={`relative z-10 w-full max-w-2xl mx-auto ${isHorizontalLayout ? 'p-8 md:p-12 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/15 shadow-2xl' : ''}`}>
              <h2 className="text-xs tracking-[0.4em] uppercase mb-12 text-center opacity-70">Directos</h2>

              <div className="space-y-0 border-t border-b border-current opacity-80 max-h-[55vh] overflow-y-auto custom-scrollbar">
                {publicLiveEvents.length > 0 ? (
                  publicLiveEvents.map((ev) => (
                    <a
                      href={`/event/${ev.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      key={ev.id}
                      className="flex justify-between py-6 border-b border-current group hover:opacity-50 transition-opacity cursor-pointer block"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 w-full">
                        <span className="text-sm tracking-widest font-light w-28 uppercase">
                          {new Date(ev.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                        <span className="text-xl font-light">{ev.title}</span>
                        <span className="text-base font-medium opacity-90 md:ml-auto text-right">{ev.venueName}</span>
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
          <section
            id="booking"
            className={`scroll-mt-24 relative min-h-screen flex flex-col items-center justify-center py-24 px-6 overflow-y-auto custom-scrollbar ${isHorizontalLayout
                ? "md:w-screen md:min-w-[100vw] md:h-screen md:shrink-0 md:border-r md:border-white/10 md:pb-32 md:pt-16 md:overflow-y-auto"
                : "w-full"
              }`}
          >
            {config.images.contactBackgroundUrl && (
              <div
                className={`absolute inset-0 z-0 bg-cover bg-center bg-no-repeat ${isHorizontalLayout ? '' : 'fixed-bg'}`}
                style={{ backgroundImage: `url(${config.images.contactBackgroundUrl})` }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: isDark
                      ? `rgba(0, 0, 0, ${(config.images.contactOverlayOpacity ?? 50) / 100})`
                      : `rgba(255, 255, 255, ${(config.images.contactOverlayOpacity ?? 50) / 100})`
                  }}
                ></div>
              </div>
            )}

            {isHorizontalLayout && (
              <>
                <div className={`hidden md:block pointer-events-none absolute inset-y-0 left-0 w-28 lg:w-40 z-20 ${isDark ? 'bg-gradient-to-r from-black/80 to-transparent' : 'bg-gradient-to-r from-white/80 to-transparent'}`} />
                <div className={`hidden md:block pointer-events-none absolute inset-y-0 right-0 w-28 lg:w-40 z-20 ${isDark ? 'bg-gradient-to-l from-black/80 to-transparent' : 'bg-gradient-to-l from-white/80 to-transparent'}`} />
              </>
            )}

            <div className={`relative z-10 w-full max-w-xl mx-auto ${isHorizontalLayout ? 'p-8 md:p-12 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/15 shadow-2xl' : ''}`}>
              <h2 className="text-xs tracking-[0.4em] uppercase mb-12 text-center opacity-70">Solicitud de Contratación</h2>

              <form onSubmit={handleBookingSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <input
                    type="text"
                    required
                    value={bookingForm.name}
                    onChange={e => setBookingForm({ ...bookingForm, name: e.target.value })}
                    placeholder="Tu Nombre o Empresa"
                    className={`w-full bg-transparent border-0 border-b border-${inputBorder}/30 py-3 px-0 focus:ring-0 focus:border-${inputBorder} transition-colors font-light text-base placeholder:font-light placeholder:text-${textColor}/30 outline-none`}
                  />
                  <input
                    type="email"
                    required
                    value={bookingForm.email}
                    onChange={e => setBookingForm({ ...bookingForm, email: e.target.value })}
                    placeholder="Email de contacto"
                    className={`w-full bg-transparent border-0 border-b border-${inputBorder}/30 py-3 px-0 focus:ring-0 focus:border-${inputBorder} transition-colors font-light text-base placeholder:font-light placeholder:text-${textColor}/30 outline-none`}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <input
                    type="tel"
                    value={bookingForm.phone}
                    onChange={e => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    placeholder="Teléfono (opcional)"
                    className={`w-full bg-transparent border-0 border-b border-${inputBorder}/30 py-3 px-0 focus:ring-0 focus:border-${inputBorder} transition-colors font-light text-base placeholder:font-light placeholder:text-${textColor}/30 outline-none`}
                  />
                  <select
                    value={bookingForm.eventType}
                    onChange={e => setBookingForm({ ...bookingForm, eventType: e.target.value })}
                    className={`w-full bg-transparent border-0 border-b border-${inputBorder}/30 py-3 px-0 focus:ring-0 focus:border-${inputBorder} transition-colors font-light text-base outline-none appearance-none cursor-pointer`}
                    style={{ color: 'inherit' }}
                  >
                    <option value="Boda / Evento Privado" className="text-black">Boda / Evento Privado</option>
                    <option value="Evento Corporativo" className="text-black">Evento Corporativo</option>
                    <option value="Fiesta Mayor / Ayuntamiento" className="text-black">Fiesta Mayor / Ayuntamiento</option>
                    <option value="Festival" className="text-black">Festival</option>
                    <option value="Otro" className="text-black">Otro</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-1">
                      Fecha del evento
                    </label>
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={bookingForm.date}
                      onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })}
                      className={`w-full bg-transparent border-0 border-b ${isDateUnavailable ? 'border-red-500 text-red-400' : `border-${inputBorder}/30`} py-3 px-0 focus:ring-0 focus:border-${inputBorder} transition-colors font-light text-base placeholder:font-light outline-none cursor-pointer`}
                      style={{ colorScheme: isDark ? 'dark' : 'light' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-1">
                      Hora prevista
                    </label>
                    <select
                      required
                      value={bookingForm.time}
                      onChange={e => setBookingForm({ ...bookingForm, time: e.target.value })}
                      className={`w-full bg-transparent border-0 border-b border-${inputBorder}/30 py-3 px-0 focus:ring-0 focus:border-${inputBorder} transition-colors font-light text-base outline-none cursor-pointer`}
                      style={{ color: 'inherit' }}
                    >
                      <option value="" className="text-black">Seleccionar hora...</option>
                      {TIME_SLOTS.map(slot => (
                        <option key={slot} value={slot} className="text-black">
                          {slot} h
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {isDateUnavailable && (
                  <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center justify-center gap-2 text-center animate-pulse">
                    <FaExclamationCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>El grupo no está disponible para esta fecha. Por favor, selecciona otro día.</span>
                  </div>
                )}

                <div>
                  <textarea
                    required
                    value={bookingForm.details}
                    onChange={e => setBookingForm({ ...bookingForm, details: e.target.value })}
                    placeholder="Detalles del evento..."
                    rows={3}
                    className={`w-full bg-transparent border-0 border-b border-${inputBorder}/30 py-3 px-0 focus:ring-0 focus:border-${inputBorder} transition-colors font-light text-base resize-none placeholder:font-light placeholder:text-${textColor}/30 outline-none`}
                  ></textarea>
                </div>
                <div className="pt-4 text-center">
                  {bookingStatus === 'success' ? (
                    <p className="text-green-500 font-light text-base animate-pulse">¡Petición enviada correctamente!</p>
                  ) : bookingStatus === 'error' ? (
                    <p className="text-red-500 font-light text-base">Hubo un error al enviar. Inténtalo de nuevo.</p>
                  ) : (
                    <button
                      type="submit"
                      disabled={bookingStatus === 'submitting' || isDateUnavailable}
                      className={`border border-current px-10 py-3 text-xs tracking-[0.3em] uppercase transition-all duration-300 ${btnHover} ${bookingStatus === 'submitting' || isDateUnavailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      {bookingStatus === 'submitting' ? 'Enviando...' : isDateUnavailable ? 'No Disponible en Esta Fecha' : 'Enviar Petición'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </section>
        )}

        {/* Contact Section & Footer */}
        <footer
          id="contact"
          className={`scroll-mt-24 pt-24 pb-12 px-6 flex flex-col items-center justify-center gap-12 relative z-10 overflow-hidden ${bgColor} ${isHorizontalLayout
              ? "md:w-screen md:min-w-[100vw] md:h-screen md:shrink-0"
              : "border-t border-current/20 w-full"
            }`}
        >
          {isHorizontalLayout && (
            <>
              <div className={`hidden md:block pointer-events-none absolute inset-y-0 left-0 w-28 lg:w-40 z-20 ${isDark ? 'bg-gradient-to-r from-black/80 to-transparent' : 'bg-gradient-to-r from-white/80 to-transparent'}`} />
              <div className={`hidden md:block pointer-events-none absolute inset-y-0 right-0 w-28 lg:w-40 z-20 ${isDark ? 'bg-gradient-to-l from-black/80 to-transparent' : 'bg-gradient-to-l from-white/80 to-transparent'}`} />
            </>
          )}

          <div className={`text-center space-y-4 opacity-90 max-w-lg ${isHorizontalLayout ? 'p-8 md:p-12 rounded-3xl bg-black/25 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10' : ''}`}>
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

            <div className="flex gap-10 items-center justify-center pt-4">
              {instagramLink && (
                <a href={instagramLink} target="_blank" rel="noreferrer" className="hover:opacity-70 transition-transform hover:scale-110">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/9/95/Instagram_logo_2022.svg" alt="Instagram" className="w-8 h-8" />
                </a>
              )}
              {profile?.contactWhatsapp && (
                <a href={`https://wa.me/${String(profile.contactWhatsapp).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="hover:opacity-70 transition-transform hover:scale-110">
                  <FaWhatsapp className="w-8 h-8 text-[#25D366]" />
                </a>
              )}
            </div>
          </div>

          <div className="mt-8 text-center flex flex-col items-center gap-3 relative z-10">
            <p className="text-[10px] tracking-widest uppercase opacity-40">
              Powered by Sona Empordà
            </p>
            <button onClick={() => setIsLoginModalOpen(true)} className="opacity-10 hover:opacity-50 transition-opacity" title="Acceso Profesional">
              <FaLock className="w-3 h-3" />
            </button>
          </div>
        </footer>
      </div>

      {/* Floating Navigation Dock en Desktop cuando Layout es Horizontal */}
      {isHorizontalLayout && (
        <div className="hidden md:flex fixed bottom-8 left-1/2 -translate-x-1/2 z-50 items-center gap-4 px-6 py-3 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 shadow-2xl text-white animate-in fade-in duration-300">
          <button
            onClick={() => goToSectionIndex(currentSectionIndex - 1)}
            disabled={currentSectionIndex === 0}
            className="p-2 rounded-full hover:bg-white/20 transition-all disabled:opacity-20 disabled:hover:bg-transparent"
            title="Sección anterior"
            aria-label="Sección anterior"
          >
            <FaChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3">
            {activeSections.map((sec, idx) => (
              <button
                key={sec.id}
                onClick={() => goToSectionIndex(idx)}
                className={`h-2 transition-all rounded-full ${currentSectionIndex === idx
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                title={sec.label}
                aria-label={sec.label}
              />
            ))}
          </div>

          <span className="text-xs uppercase tracking-widest font-mono text-white/70 min-w-[70px] text-center">
            {String(currentSectionIndex + 1).padStart(2, '0')} / {String(activeSections.length).padStart(2, '0')}
          </span>

          <button
            onClick={() => goToSectionIndex(currentSectionIndex + 1)}
            disabled={currentSectionIndex === activeSections.length - 1}
            className="p-2 rounded-full hover:bg-white/20 transition-all disabled:opacity-20 disabled:hover:bg-transparent"
            title="Sección siguiente"
            aria-label="Sección siguiente"
          >
            <FaChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Lightbox / Modal Cine para Vídeos de YouTube */}
      {cinemaVideoIndex !== null && ytIds[cinemaVideoIndex] && (
        <div
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300"
          onClick={() => setCinemaVideoIndex(null)}
        >
          {/* Barra superior del reproductor de cine */}
          <div
            className="w-full max-w-5xl flex items-center justify-between mb-3 px-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-[0.25em] text-gold font-bold">
                Sala de Cine
              </span>
              {ytIds.length > 1 && (
                <span className="text-xs font-mono text-white/60 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                  {cinemaVideoIndex + 1} / {ytIds.length}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setCinemaVideoIndex(null)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs uppercase tracking-widest font-medium transition-all cursor-pointer border border-white/15"
              title="Cerrar (Esc)"
            >
              <span>Cerrar</span>
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Marco del vídeo en 16:9 */}
          <div
            className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl shadow-gold/10"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              key={ytIds[cinemaVideoIndex]}
              src={`https://www.youtube.com/embed/${ytIds[cinemaVideoIndex]}?autoplay=1&rel=0&modestbranding=1`}
              title={`Vídeo ${cinemaVideoIndex + 1}`}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />

            {/* Controles de anterior/siguiente dentro del modal */}
            {ytIds.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCinemaVideoIndex(prev => (prev !== null && prev > 0 ? prev - 1 : ytIds.length - 1));
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 hover:bg-gold hover:text-black text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-xl backdrop-blur-sm"
                  title="Vídeo anterior"
                >
                  <FaChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCinemaVideoIndex(prev => (prev !== null && prev < ytIds.length - 1 ? prev + 1 : 0));
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 hover:bg-gold hover:text-black text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-xl backdrop-blur-sm"
                  title="Vídeo siguiente"
                >
                  <FaChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Selector de puntos si hay varios vídeos */}
          {ytIds.length > 1 && (
            <div
              className="mt-4 flex items-center justify-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {ytIds.map((_, idx) => (
                <button
                  key={`cine-dot-${idx}`}
                  type="button"
                  onClick={() => setCinemaVideoIndex(idx)}
                  className={`transition-all rounded-full h-2 cursor-pointer ${cinemaVideoIndex === idx
                      ? 'w-8 bg-gold'
                      : 'w-2 bg-white/30 hover:bg-white/60'
                    }`}
                  title={`Ir al vídeo ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-sm ${isDark ? 'bg-black border border-white/20' : 'bg-white border border-black/20'} p-8 shadow-2xl relative`}
          >
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 opacity-50 hover:opacity-100"
            >
              <FaTimes />
            </button>
            <h3 className="text-sm tracking-[0.2em] uppercase mb-6 text-center font-medium">Acceso Rápido</h3>
            <p className="text-xs opacity-70 mb-6 text-center font-light">
              Hola, <strong>{profile?.stageName}</strong>. Introduce tu contraseña para acceder a tu panel.
            </p>

            <form onSubmit={handleQuickLogin} className="space-y-6">
              <input
                type="password"
                autoFocus
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                className={`w-full bg-transparent border-0 border-b ${isDark ? 'border-white/30 focus:border-white' : 'border-black/30 focus:border-black'} py-3 px-0 focus:ring-0 transition-colors font-light outline-none text-center`}
              />
              {loginError && (
                <p className="text-red-500 text-xs text-center">{loginError}</p>
              )}
              <button
                type="submit"
                disabled={isLoggingIn}
                className={`w-full border border-current py-3 text-xs tracking-[0.2em] uppercase transition-all duration-300 ${btnHover} ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoggingIn ? 'Entrando...' : 'Entrar al Panel'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
