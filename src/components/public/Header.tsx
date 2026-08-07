import { Link, useNavigate } from "react-router-dom";
import { FiMenu, FiSearch, FiUser } from "react-icons/fi";

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-sm border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Burger Menu (Left) */}
        <button className="text-white hover:text-gold transition-colors flex items-center gap-2">
          <FiMenu className="w-6 h-6 stroke-[1.5]" />
          <span className="hidden sm:block text-xs uppercase tracking-[0.2em]">Menú</span>
        </button>

        {/* Logo (Center) */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <Link to="/">
            <h1 className="text-2xl md:text-3xl tracking-widest uppercase">
              SONA<span className="text-gold font-serif lowercase px-2">Empordà</span>
            </h1>
          </Link>
        </div>
        
        {/* Actions (Right) */}
        <div className="flex items-center gap-6">
          <button className="text-white hover:text-gold transition-colors flex items-center gap-2 hidden md:flex">
            <span className="text-xs uppercase tracking-[0.2em]">Buscar</span>
            <FiSearch className="w-5 h-5 stroke-[1.5]" />
          </button>
          
          <button 
            onClick={() => navigate("/login")}
            className="text-white hover:text-gold transition-colors flex items-center gap-2"
          >
            <span className="hidden sm:block text-xs uppercase tracking-[0.2em]">Acceso</span>
            <FiUser className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>
      </div>
    </header>
  );
};
