import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../contexts/AuthContext';

export const FloatingChatButton: React.FC = () => {
  const navigate = useNavigate();
  const { unreadCount } = useChat();
  const { userRole } = useAuth();

  const handleClick = () => {
    if (userRole === 'venue') {
      navigate('/venue/messages');
    } else {
      navigate('/musician/messages');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-20 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-gold hover:bg-yellow-500 text-black rounded-full shadow-lg shadow-black/50 flex items-center justify-center transition-transform hover:scale-110 z-50 group"
      aria-label="Abrir mensajes"
    >
      <MessageCircle className="w-7 h-7" />
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold shadow-md border-2 border-black animate-bounce">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Tooltip on desktop */}
      <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-black/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block">
        Mensajes
      </span>
    </button>
  );
};
