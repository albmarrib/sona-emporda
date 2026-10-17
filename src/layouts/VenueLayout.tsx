import { Link, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase/firebase';
import { signOut } from 'firebase/auth';
import { FiList, FiSearch, FiCalendar, FiLifeBuoy, FiLogOut, FiSettings } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { OnboardingWizard } from '../components/shared/OnboardingWizard';
import { TutorialSlides } from '../components/shared/TutorialSlides';
import { Info } from 'lucide-react';
import { FloatingChatButton } from '../components/chat/FloatingChatButton';
import { PushNotificationBanner } from '../components/chat/PushNotificationBanner';
import { InviteColleagues } from '../components/shared/InviteColleagues';
import { SwipeWrapper } from '../components/musician/SwipeWrapper';

/**
 * Rutas de las 3 vistas principales del local.
 * Reciben SwipeWrapper en móvil y ocupan todo el espacio disponible.
 *
 * IMPORTANTE: SwipeWrapper lee useLocation() internamente, así que funciona
 * con cualquier array de rutas que le pasemos. Sin embargo, el componente
 * actual está parametrizado para las rutas del músico. Por eso creamos el
 * VenueSwipeWrapper inline aquí con las rutas correctas.
 */
const VENUE_HUB_ROUTES = [
  '/venue/calendar',
  '/venue/search',
  '/venue/dashboard',
];

// Mini wrapper idéntico a SwipeWrapper pero con las rutas del local
import { type ReactNode } from 'react';
import { useNavigate as useNav } from 'react-router-dom';
import { motion as m } from 'framer-motion';

const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY  = 250;

const VenueSwipeWrapper = ({ children }: { children: ReactNode }) => {
  const nav      = useNav();
  const { pathname } = useLocation();

  const idx = VENUE_HUB_ROUTES.findIndex(r => pathname === r || pathname.startsWith(r + '/'));
  if (idx === -1) return <>{children}</>;

  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    const ox = info.offset.x;
    const vx = info.velocity.x;
    if ((ox < -SWIPE_THRESHOLD || vx < -SWIPE_VELOCITY) && idx < VENUE_HUB_ROUTES.length - 1) {
      nav(VENUE_HUB_ROUTES[idx + 1]);
    }
    if ((ox > SWIPE_THRESHOLD || vx > SWIPE_VELOCITY) && idx > 0) {
      nav(VENUE_HUB_ROUTES[idx - 1]);
    }
  };

  return (
    <m.div
      drag="x"
      dragElastic={{ left: 0.07, right: 0.07 }}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      style={{ touchAction: 'pan-y', height: '100%', width: '100%' }}
    >
      {children}
    </m.div>
  );
};

export const VenueLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentUser, userData, loading } = useAuth();
  const outlet = useOutlet();

  const [showWizard, setShowWizard] = useState(
    userData && userData.onboardingCompleted === undefined ? true : !userData?.onboardingCompleted,
  );
  const [showTutorial, setShowTutorial] = useState(
    userData && userData.tutorialSeen === undefined ? true : !userData?.tutorialSeen,
  );

  useEffect(() => {
    // Exceptuamos tanto /venue/profile (destino) como /venue (el Hub de entrada)
    // para no interceptar al usuario justo cuando aterriza en el Hub.
    const isExempt = pathname === '/venue/profile' || pathname === '/venue';
    if (!loading && userData && !userData.address && !isExempt) {
      navigate('/venue/profile');
    }
  }, [userData, pathname, navigate, loading]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { name: 'Agenda',    path: '/venue/calendar',  icon: <FiCalendar className="w-5 h-5" /> },
    { name: 'Músicos',   path: '/venue/search',    icon: <FiSearch className="w-5 h-5" /> },
    { name: 'Eventos',   path: '/venue/dashboard', icon: <FiList className="w-5 h-5" /> },
    { name: 'SOS',       path: '/venue/sos',       icon: <FiLifeBuoy className="w-5 h-5" /> },
    { name: 'Perfil',    path: '/venue/profile',   icon: <FiSettings className="w-5 h-5" /> },
  ];

  /** ¿Estamos en una de las 3 vistas principales en móvil? */
  const isHubRoute = VENUE_HUB_ROUTES.some(
    r => pathname === r || pathname.startsWith(r + '/'),
  );

  return (
    <div className="flex h-[100dvh] w-full bg-black text-white font-sans overflow-hidden">
      {showWizard && <OnboardingWizard onComplete={() => setShowWizard(false)} />}
      {!showWizard && showTutorial && <TutorialSlides onClose={() => setShowTutorial(false)} />}

      {/* ── Sidebar Desktop ───────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/10 h-full bg-zinc-950">
        <div className="p-8 border-b border-white/10 flex flex-col gap-2">
          <Link to="/" className="text-xl tracking-widest font-sans font-bold">
            <span className="text-white">SONA</span><span className="text-gold font-serif font-normal">Empordà</span>
          </Link>
          <div className="text-[10px] uppercase tracking-[0.2em] text-gold border border-gold/30 bg-gold/10 px-2 py-1 w-fit rounded-sm font-bold">
            Panel de Local
          </div>
        </div>

        <nav className="flex-1 py-8 px-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/venue' && pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-4 px-4 py-3 text-xs uppercase tracking-widest transition-colors ${
                  isActive ? 'bg-white/10 text-gold border-r-2 border-gold' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="px-4 pb-4">
            <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Local conectado</p>
            <p className="text-xs truncate font-bold">{userData?.name || currentUser?.email || 'Mi Local'}</p>
          </div>

          <div className="flex gap-2 w-full mb-2">
            <div className="flex-shrink-0 flex items-center justify-center">
              <InviteColleagues userType="venue" />
            </div>
            <button
              onClick={() => setShowTutorial(true)}
              className="flex-1 flex items-center justify-center gap-2 px-2 py-3 text-xs uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Info className="w-5 h-5" />
              Tutorial
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-xs uppercase tracking-widest text-white/60 hover:text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <FiLogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="flex flex-col flex-1 h-full overflow-hidden min-w-0 bg-zinc-950">

        {/* Mobile Header */}
        <div className="md:hidden flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md z-40">
          <div className="flex flex-col">
            <Link to="/venue" className="text-lg tracking-widest font-sans font-bold leading-none">
              <span className="text-white">SONA</span><span className="text-gold font-serif font-normal">Empordà</span>
            </Link>
            <span className="text-[11px] text-white/70 font-bold truncate max-w-[180px] mt-0.5 leading-none">
              {userData?.name || currentUser?.email || 'Mi Local'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <InviteColleagues userType="venue" />
            <button
              onClick={() => setShowTutorial(true)}
              className="text-white/50 hover:text-white p-2 active:scale-95 transition-transform"
              title="Ver Tutorial"
            >
              <Info className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="text-white/50 hover:text-red-400 p-2 active:scale-95 transition-transform"
            >
              <FiLogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Content area ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">

          {/*
           * MÓVIL — 3 vistas principales:
           *   Espacio completo, sin padding, con swipe invisible.
           */}
          {isHubRoute ? (
            <div className="md:hidden flex-1 min-h-0 pb-16 overflow-hidden">
              <VenueSwipeWrapper>
                <div className="h-full w-full overflow-y-auto overflow-x-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={pathname}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="h-full w-full"
                    >
                      {outlet}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </VenueSwipeWrapper>
            </div>
          ) : (
            /* MÓVIL — rutas secundarias (sos, profile, messages, home) */
            <div className="md:hidden flex-1 overflow-y-auto overflow-x-hidden pb-16">
              <div className="p-4 sm:p-6 max-w-3xl mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.18 }}
                  >
                    {outlet}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* DESKTOP — layout clásico */}
          <div className="hidden md:block flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-4 sm:p-6 md:p-12 max-w-6xl mx-auto min-h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="w-full min-h-full"
                >
                  {outlet}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* ── Mobile Bottom Navigation ──────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 z-50 safe-area-pb">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/venue' && pathname.startsWith(item.path));
            const isSOS    = item.path.includes('sos');

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-95 ${
                  isActive ? 'text-gold' : 'text-white/40 hover:text-white'
                } ${isSOS ? 'relative' : ''}`}
              >
                {isSOS && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-red-900/20 rounded-full blur-md" />
                )}
                <div className={`${isSOS ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)] z-10' : ''} relative`}>
                  {item.icon}
                </div>
                <span className="text-[9px] uppercase tracking-wider">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <FloatingChatButton />
      <PushNotificationBanner />
    </div>
  );
};
