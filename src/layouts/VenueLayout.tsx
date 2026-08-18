import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase/firebase';
import { signOut } from 'firebase/auth';
import { FiHome, FiSearch, FiCalendar, FiLifeBuoy, FiLogOut, FiSettings } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { OnboardingWizard } from '../components/shared/OnboardingWizard';
import { TutorialSlides } from '../components/shared/TutorialSlides';
import { Info } from 'lucide-react';

export const VenueLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentUser, userData, loading } = useAuth();
  const [showWizard, setShowWizard] = useState(
    userData && userData.onboardingCompleted === undefined ? true : !userData?.onboardingCompleted
  );
  const [showTutorial, setShowTutorial] = useState(
    userData && userData.tutorialSeen === undefined ? true : !userData?.tutorialSeen
  );

  useEffect(() => {
    if (!loading && userData && !userData.address && pathname !== '/venue/profile') {
      navigate('/venue/profile');
    }
  }, [userData, pathname, navigate, loading]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/venue', icon: <FiHome className="w-5 h-5" /> },
    { name: 'Calendario', path: '/venue/calendar', icon: <FiCalendar className="w-5 h-5" /> },
    { name: 'Buscador', path: '/venue/search', icon: <FiSearch className="w-5 h-5" /> },
    { name: 'Urgencias SOS', path: '/venue/sos', icon: <FiLifeBuoy className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-[100dvh] w-full bg-black text-white font-sans overflow-hidden">
      {showWizard && <OnboardingWizard onComplete={() => setShowWizard(false)} />}
      {!showWizard && showTutorial && <TutorialSlides onClose={() => setShowTutorial(false)} />}
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/10 h-full bg-zinc-950">
        <div className="p-8 border-b border-white/10 flex flex-col gap-2">
          <Link to="/" className="text-xl tracking-widest uppercase">
            SONA<span className="text-gold font-serif lowercase px-1">Empordà</span>
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
                className={`flex items-center gap-4 px-4 py-3 text-xs uppercase tracking-widest transition-colors ${
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
          <div className="px-4 pb-4 flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Local conectado</p>
              <p className="text-xs truncate font-bold">{userData?.name || currentUser?.email || 'Mi Local'}</p>
            </div>
            <Link to="/venue/profile" className="text-white/40 hover:text-white transition-colors" title="Perfil del Local">
              <FiSettings className="w-4 h-4" />
            </Link>
          </div>
          
          <button 
            onClick={() => setShowTutorial(true)}
            className="w-full flex items-center gap-4 px-4 py-3 text-xs uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-colors mb-2"
          >
            <Info className="w-5 h-5" />
            Ver Tutorial
          </button>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-xs uppercase tracking-widest text-white/60 hover:text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <FiLogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden min-w-0 bg-black pb-20 md:pb-0">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex flex-col">
            <Link to="/" className="text-lg tracking-widest uppercase flex items-center gap-2">
              <span>SONA</span>
              <span className="text-gold font-serif lowercase">Empordà</span>
              <span className="text-[8px] border border-gold text-gold px-1 ml-2">LOCAL</span>
            </Link>
            <span className="text-[10px] text-white/60 font-bold truncate max-w-[150px] mt-1">
              {userData?.name || currentUser?.email || 'Mi Local'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowTutorial(true)} 
              className="text-white/60 hover:text-white active:scale-95 transition-transform"
              title="Ver Tutorial"
            >
              <Info className="w-5 h-5" />
            </button>
            <Link to="/venue/profile" className="text-white/60 hover:text-white transition-colors active:scale-95">
              <FiSettings className="w-5 h-5" />
            </Link>
            <button onClick={handleLogout} className="text-white/60 hover:text-red-400 active:scale-95 transition-transform">
              <FiLogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-12 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 z-50 safe-area-pb">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/venue' && pathname.startsWith(item.path));
            const isSOS = item.path.includes('sos');
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-95 ${
                  isActive ? 'text-gold' : 'text-white/40 hover:text-white'
                } ${isSOS ? 'relative' : ''}`}
              >
                {isSOS && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-red-900/20 rounded-full blur-md"></div>
                )}
                <div className={`${isSOS ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)] z-10' : ''}`}>
                  {item.icon}
                </div>
                <span className="text-[9px] uppercase tracking-wider">{item.name.replace(' & Booking', '').replace('Urgencias ', '').replace('Buscador ', '')}</span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
};
