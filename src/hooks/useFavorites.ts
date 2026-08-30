import { useState, useEffect, useCallback } from 'react';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);

  const loadFavorites = useCallback(() => {
    try {
      const stored = localStorage.getItem('sona_favorites');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        } else {
          setFavorites([]);
        }
      }
    } catch (e) {
      console.error('Error loading favorites from localStorage', e);
      setFavorites([]);
    }
  }, []);

  // Cargar favoritos iniciales y escuchar cambios
  useEffect(() => {
    loadFavorites();
    
    // Escuchar cambios de storage (pestañas cruzadas)
    window.addEventListener('storage', loadFavorites);
    // Escuchar evento custom (misma pestaña)
    window.addEventListener('sona_favorites_changed', loadFavorites);
    
    return () => {
      window.removeEventListener('storage', loadFavorites);
      window.removeEventListener('sona_favorites_changed', loadFavorites);
    };
  }, [loadFavorites]);

  const toggleFavorite = useCallback((eventId: string) => {
    const safeFavorites = Array.isArray(favorites) ? favorites : [];
    const isFav = safeFavorites.includes(eventId);
    const newFavorites = isFav 
      ? safeFavorites.filter(id => id !== eventId)
      : [...safeFavorites, eventId];
    
    try {
      localStorage.setItem('sona_favorites', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
      
      // Diferir el evento un ciclo para evitar actualizar otros componentes durante el renderizado actual
      setTimeout(() => {
        window.dispatchEvent(new Event('sona_favorites_changed'));
      }, 0);
    } catch (e) {
      console.error('Error saving favorites to localStorage', e);
    }
  }, [favorites]);

  const isFavorite = (eventId: string) => {
    return Array.isArray(favorites) && favorites.includes(eventId);
  };

  return {
    favorites: Array.isArray(favorites) ? favorites : [],
    toggleFavorite,
    isFavorite
  };
};
