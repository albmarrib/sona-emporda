import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu, FiSearch, FiUser, FiX } from "react-icons/fi";

interface HeaderProps {
  onOpenSearch?: () => void;
  activeFiltersCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, activeFiltersCount = 0 }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNav = (view: string) => {
    setIsMenuOpen(false);
    navigate(`/?view=${view}`);
    // Scroll al inicio de la página suavemente
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const handleSearchClick = () => {
    if (onOpenSearch) {
      onOpenSearch();
    } else {
      navigate('/?search=open');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-md border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Burger Menu (Left) */}
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-gold transition-colors flex items-center gap-2 p-2 -ml-2 active:scale-95"
            >
              {isMenuOpen ? <FiX className="w-6 h-6 stroke-[1.5]" /> : <FiMenu className="w-6 h-6 stroke-[1.5]" />}
              <span className="hidden sm:block text-xs uppercase tracking-[0.2em]">Menú</span>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-950 border border-white/10 shadow-2xl rounded-sm animate-in slide-in-from-top-2 fade-in duration-200">
                <nav className="flex flex-col py-2">
                  <button onClick={() => handleNav('LISTA')} className="text-left px-4 py-3 text-sm hover:bg-white/5 hover:text-gold transition-colors">
                    Lista
                  </button>
                  <button onClick={() => handleNav('CALENDARIO')} className="text-left px-4 py-3 text-sm hover:bg-white/5 hover:text-gold transition-colors">
                    Calendario
                  </button>
                  <button onClick={() => handleNav('LUGARES')} className="text-left px-4 py-3 text-sm hover:bg-white/5 hover:text-gold transition-colors">
                    Lugares
                  </button>
                  <div className="h-[1px] bg-white/10 my-2"></div>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-left px-4 py-3 text-xs tracking-widest uppercase text-gold hover:bg-white/5 transition-colors">
                    Acceso Profesionales
                  </Link>
                </nav>
              </div>
            )}
          </div>

          {/* Logo (Center): SONA (blanco mayúsculas) y Empordà (dorado, primera mayúscula, sin espacio) */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center select-none">
            <Link to="/">
              <h1 className="text-2xl md:text-3xl tracking-widest font-sans font-bold">
                <span className="text-white">SONA</span><span className="text-gold font-serif font-normal">Empordà</span>
              </h1>
            </Link>
          </div>
          
          {/* Actions (Right) */}
          <div className="flex items-center gap-3 sm:gap-6">
            <button 
              onClick={handleSearchClick}
              className={`transition-colors flex items-center gap-2 p-2 active:scale-95 ${
                activeFiltersCount > 0 
                  ? 'text-gold font-bold' 
                  : 'text-white hover:text-gold'
              }`}
              title="Buscar y filtrar eventos"
              aria-label="Buscar"
            >
              <span className="hidden sm:block text-xs uppercase tracking-[0.2em]">Buscar</span>
              <div className="relative">
                <FiSearch className="w-5 h-5 stroke-[1.5]" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-gold text-black text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold font-sans">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
            </button>
            
            <button 
              onClick={() => navigate("/login")}
              className="text-white hover:text-gold transition-colors flex items-center gap-2 p-2 -mr-2 active:scale-95"
              aria-label="Acceso"
            >
              <span className="hidden sm:block text-xs uppercase tracking-[0.2em]">Acceso</span>
              <FiUser className="w-5 h-5 stroke-[1.5]" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
