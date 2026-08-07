import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase/firebase';
import { signOut } from 'firebase/auth';
import { FiHome, FiSearch, FiCalendar, FiLifeBuoy, FiLogOut, FiSettings } from 'react-icons/fi';

export const VenueLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/venue', icon: <FiHome className="w-5 h-5" /> },
    { name: 'Buscador IA', path: '/venue/search', icon: <FiSearch className="w-5 h-5" /> },
    { name: 'Agenda & Booking', path: '/venue/calendar', icon: <FiCalendar className="w-5 h-5" /> },
    { name: 'Urgencias SOS', path: '/venue/sos', icon: <FiLifeBuoy className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      
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
              <p className="text-xs truncate font-bold">{currentUser?.email || 'local@sonaemporda.com'}</p>
            </div>
            <Link to="/venue/profile" className="text-white/40 hover:text-white transition-colors" title="Perfil del Local">
              <FiSettings className="w-4 h-4" />
            </Link>
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

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto bg-black">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-zinc-950 sticky top-0 z-50">
          <Link to="/" className="text-lg tracking-widest uppercase flex items-center gap-2">
            <span>SONA</span>
            <span className="text-gold font-serif lowercase">Empordà</span>
            <span className="text-[8px] border border-gold text-gold px-1 ml-2">LOCAL</span>
          </Link>
          {/* Mobile menu button could go here */}
        </div>

        <div className="p-6 md:p-12 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>

    </div>
  );
};
