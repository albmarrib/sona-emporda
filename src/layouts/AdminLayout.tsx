import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import { signOut } from 'firebase/auth';
import { FiLogOut, FiSettings } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export const AdminLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { name: 'Patrocinios', mobileName: 'Sponsors', path: '/admin', icon: <FiSettings className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-[100dvh] w-full bg-black text-white font-sans overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/10 h-full">
        <div className="p-8 border-b border-white/10 flex flex-col gap-2">
          <Link to="/" className="text-xl tracking-widest uppercase">
            SONA<span className="text-gold font-serif lowercase px-1">Empordà</span>
          </Link>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 border border-white/20 bg-red-900/20 px-2 py-1 w-fit rounded-sm font-bold">
            Administración
          </div>
        </div>

        <nav className="flex-1 py-8 px-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path));
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
            <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Sesión iniciada como</p>
            <p className="text-xs truncate font-bold text-red-400">ADMINISTRADOR</p>
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
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden min-w-0 bg-zinc-950 pb-20 md:pb-0">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex flex-col">
            <Link to="/" className="text-lg tracking-widest uppercase">
              SONA<span className="text-gold font-serif lowercase px-1">Empordà</span>
            </Link>
            <span className="text-xs text-red-400 font-bold truncate max-w-[200px] mt-0.5">
              ADMINISTRADOR
            </span>
          </div>
          <button onClick={handleLogout} className="text-white/60 hover:text-red-400 p-2 active:scale-95 transition-transform">
            <FiLogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 md:p-12 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 z-50 safe-area-pb">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-95 ${
                  isActive ? 'text-gold' : 'text-white/40 hover:text-white'
                }`}
              >
                <div>
                  {item.icon}
                </div>
                <span className="text-[9px] uppercase tracking-wider">{item.mobileName || item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
