import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase/firebase';
import { signOut } from 'firebase/auth';
import { FiHome, FiUser, FiCalendar, FiLifeBuoy, FiLogOut } from 'react-icons/fi';

export const MusicianLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/musician', icon: <FiHome className="w-5 h-5" /> },
    { name: 'Mi EPK', path: '/musician/epk', icon: <FiUser className="w-5 h-5" /> },
    { name: 'Calendario', path: '/musician/calendar', icon: <FiCalendar className="w-5 h-5" /> },
    { name: 'Tablón SOS', path: '/musician/sos', icon: <FiLifeBuoy className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/10 h-full">
        <div className="p-8 border-b border-white/10">
          <Link to="/" className="text-xl tracking-widest uppercase">
            SONA<span className="text-gold font-serif lowercase px-1">Empordà</span>
          </Link>
          <div className="mt-4 text-xs uppercase tracking-[0.2em] text-white/40">
            Panel de Músico
          </div>
        </div>

        <nav className="flex-1 py-8 px-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/musician' && pathname.startsWith(item.path));
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
          <div className="px-4 pb-4">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Sesión iniciada</p>
            <p className="text-xs truncate">{currentUser?.email}</p>
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
      <main className="flex-1 h-full overflow-y-auto bg-zinc-950">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-black sticky top-0 z-50">
          <Link to="/" className="text-lg tracking-widest uppercase">
            SONA<span className="text-gold font-serif lowercase px-1">Empordà</span>
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
