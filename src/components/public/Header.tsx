import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu, FiSearch, FiUser, FiX, FiDownload } from "react-icons/fi";

interface HeaderProps {
  onOpenSearch?: () => void;
  activeFiltersCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, activeFiltersCount = 0 }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    setIsStandalone(Boolean(standalone));
  }, []);

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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 md:h-20 grid grid-cols-[auto_1fr_auto] items-center gap-1.5 sm:gap-4">
          
          {/* Burger Menu (Left) */}
          <div className="relative justify-self-start">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-gold transition-colors flex items-center gap-1.5 p-2 active:scale-95 cursor-pointer"
              aria-label="Abrir menú"
            >
              {isMenuOpen ? <FiX className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]" /> : <FiMenu className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]" />}
              <span className="hidden sm:block text-xs uppercase tracking-[0.2em]">Menú</span>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-60 bg-zinc-950 border border-white/10 shadow-2xl rounded-sm animate-in slide-in-from-top-2 fade-in duration-200 z-50">
                <nav className="flex flex-col py-2">
                  <button onClick={() => handleNav('LISTA')} className="text-left px-4 py-3 text-sm hover:bg-white/5 hover:text-gold transition-colors flex items-center justify-between cursor-pointer">
                    <span>Lista</span>
                  </button>
                  <button onClick={() => handleNav('CALENDARIO')} className="text-left px-4 py-3 text-sm hover:bg-white/5 hover:text-gold transition-colors flex items-center justify-between cursor-pointer">
                    <span>Calendario</span>
                  </button>
                  <button onClick={() => handleNav('LUGARES')} className="text-left px-4 py-3 text-sm hover:bg-white/5 hover:text-gold transition-colors flex items-center justify-between cursor-pointer">
                    <span>Lugares</span>
                  </button>
                  
                  {!isStandalone && (
                    <>
                      <div className="h-[1px] bg-white/10 my-1"></div>
                      <button 
                        onClick={() => {
                          setIsMenuOpen(false);
                          window.dispatchEvent(new Event('open-pwa-modal'));
                        }} 
                        className="text-left px-4 py-3 text-xs tracking-wider uppercase text-gold hover:bg-white/5 transition-colors flex items-center gap-2 font-bold cursor-pointer"
                      >
                        <FiDownload className="w-4 h-4 text-gold" />
                        <span>Instalar App</span>
                      </button>
                    </>
                  )}

                  <div className="h-[1px] bg-white/10 my-1"></div>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-left px-4 py-3 text-xs tracking-widest uppercase text-white/70 hover:text-gold hover:bg-white/5 transition-colors flex items-center gap-2">
                    <FiUser className="w-3.5 h-3.5 text-gold" />
                    <span>Acceso Profesionales</span>
                  </Link>
                </nav>
              </div>
            )}
          </div>

          {/* Logo (Center): Columna central garantizada para no solapar */}
          <div className="justify-self-center text-center select-none min-w-0 px-1">
            <Link to="/" className="inline-block max-w-full">
              <h1 className="text-lg sm:text-2xl md:text-3xl tracking-wide sm:tracking-widest font-sans font-bold whitespace-nowrap">
                <span className="text-white">SONA</span><span className="text-gold font-serif font-normal">Empordà</span>
              </h1>
            </Link>
          </div>
          
          {/* Actions (Right) */}
          <div className="justify-self-end flex items-center gap-1 sm:gap-3">
            {!isStandalone && (
              <button
                onClick={() => window.dispatchEvent(new Event('open-pwa-modal'))}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 hover:bg-gold hover:text-black border border-gold/30 rounded-full text-gold text-xs font-bold transition-all cursor-pointer mr-1"
                title="Instalar App en tu dispositivo"
              >
                <FiDownload className="w-3.5 h-3.5" />
                <span>Instalar</span>
              </button>
            )}

            <button 
              onClick={handleSearchClick}
              className={`transition-colors flex items-center gap-1.5 p-2 active:scale-95 cursor-pointer ${
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
              className="text-white hover:text-gold transition-colors flex items-center gap-1.5 p-2 active:scale-95 cursor-pointer"
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
