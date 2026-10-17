import React, { useRef, useEffect } from 'react';
import { FiSearch, FiX, FiUser, FiMusic, FiHeart, FiRotateCcw } from 'react-icons/fi';
import { Heart } from 'lucide-react';

interface InlineSearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  musicians: string[];
  selectedMusician: string | null;
  onSelectMusician: (m: string | null) => void;
  vibes: string[];
  selectedVibe: string;
  onSelectVibe: (v: string) => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  onResetAll: () => void;
  totalFilteredEvents: number;
  totalConfirmedEvents: number;
}

export const InlineSearchBar: React.FC<InlineSearchBarProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchQueryChange,
  musicians,
  selectedMusician,
  onSelectMusician,
  vibes,
  selectedVibe,
  onSelectVibe,
  showFavoritesOnly,
  onToggleFavorites,
  onResetAll,
  totalFilteredEvents,
  totalConfirmedEvents,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasActiveFilters = 
    searchQuery.trim().length > 0 || 
    Boolean(selectedMusician) || 
    Boolean(selectedVibe) || 
    showFavoritesOnly;

  return (
    <div 
      id="search-panel"
      className="w-full bg-zinc-950/95 border border-white/15 rounded-xl p-4 sm:p-5 shadow-2xl backdrop-blur-md mb-8 animate-in fade-in slide-in-from-top-3 duration-200"
    >
      {/* Fila 1: Input de búsqueda de texto en tiempo real */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 flex items-center">
          <FiSearch className="absolute left-3.5 w-4 h-4 text-gold/70 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Buscar por nombre de evento, local o músico..."
            className="w-full bg-black/60 border border-white/20 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange('')}
              className="absolute right-3 text-white/40 hover:text-white p-1"
              title="Borrar texto"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botón cerrar barra */}
        <button
          onClick={onClose}
          className="text-white/50 hover:text-white p-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
          title="Ocultar barra de búsqueda"
          aria-label="Cerrar búsqueda"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* Fila 2: Filtros compactos desplegables (Músicos, Estilos, Favoritos y botón Todos) */}
      <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
        
        {/* Selector de Músicos: Lista desplegable alfabética compacta */}
        <div className="flex-1 min-w-[180px] sm:max-w-xs relative">
          <div className="relative flex items-center">
            <FiUser className="absolute left-3 w-3.5 h-3.5 text-white/40 pointer-events-none" />
            <select
              value={selectedMusician || ''}
              onChange={(e) => onSelectMusician(e.target.value ? e.target.value : null)}
              className="w-full bg-black/70 border border-white/20 text-white text-xs pl-8 pr-8 py-2 rounded-lg appearance-none focus:border-gold focus:outline-none cursor-pointer transition-colors"
            >
              <option value="" className="bg-zinc-900 text-white">Todos los músicos</option>
              {musicians.map((name) => (
                <option key={name} value={name} className="bg-zinc-900 text-white">
                  {name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 pointer-events-none text-white/40 text-[10px]">▼</div>
          </div>
        </div>

        {/* Selector de Estilos / Tipos de evento: Lista desplegable compacta */}
        <div className="flex-1 min-w-[160px] sm:max-w-xs relative">
          <div className="relative flex items-center">
            <FiMusic className="absolute left-3 w-3.5 h-3.5 text-white/40 pointer-events-none" />
            <select
              value={selectedVibe}
              onChange={(e) => onSelectVibe(e.target.value)}
              className="w-full bg-black/70 border border-white/20 text-white text-xs pl-8 pr-8 py-2 rounded-lg appearance-none focus:border-gold focus:outline-none cursor-pointer transition-colors"
            >
              <option value="" className="bg-zinc-900 text-white">Todos los estilos</option>
              {vibes.map((v) => (
                <option key={v} value={v} className="bg-zinc-900 text-white">
                  {v}
                </option>
              ))}
            </select>
            <div className="absolute right-3 pointer-events-none text-white/40 text-[10px]">▼</div>
          </div>
        </div>

        {/* Box / Botón de Favoritos */}
        <button
          type="button"
          onClick={onToggleFavorites}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
            showFavoritesOnly
              ? 'bg-red-500/20 border-red-500 text-red-400 font-bold shadow-md shadow-red-500/10'
              : 'bg-black/70 border-white/20 text-white/70 hover:text-white hover:border-white/40'
          }`}
          title="Ver solo mis conciertos favoritos"
        >
          <Heart className={`w-3.5 h-3.5 transition-colors ${showFavoritesOnly ? 'fill-red-500 text-red-500' : 'text-white/60'}`} />
          <span>Favoritos</span>
        </button>

        {/* Botón TODOS para limpiar todo y volver al estado inicial */}
        <button
          type="button"
          onClick={onResetAll}
          className={`px-4 py-2 text-xs uppercase tracking-wider font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
            hasActiveFilters
              ? 'bg-gold text-black hover:bg-white'
              : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20 border border-white/10'
          }`}
          title="Ver todos los conciertos sin filtros"
        >
          <FiRotateCcw className="w-3 h-3" />
          <span>Todos</span>
        </button>

        {/* Contador de resultados */}
        <div className="ml-auto text-[11px] text-white/50 tracking-wider">
          Mostrando <strong className="text-gold">{totalFilteredEvents}</strong> de {totalConfirmedEvents} conciertos
        </div>
      </div>
    </div>
  );
};
