import React, { useState } from 'react';
import { MessageCircle, Calendar } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../contexts/AuthContext';
import { useBookingRequests } from '../../hooks/useBookingRequests';
import { BookingRequestModal } from './BookingRequestModal';

export const FloatingChatButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useChat();
  const { userRole } = useAuth();
  const { bookingRequests, unreadBookingCount, pendingBookingCount, markAsRead } = useBookingRequests();

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Si el usuario ya está dentro de la pantalla de mensajes/chat, NO mostrar el botón flotante
  // para evitar que tape el botón de enviar o el campo de texto en móvil
  if (location.pathname.includes('/messages')) {
    return null;
  }

  // Total acumulado de avisos para el globo numérico: SOLO NO LEÍDOS
  const totalCount = unreadCount + unreadBookingCount;

  const handleButtonClick = () => {
    // Si hay de ambos tipos NO LEÍDOS: abrir selector emergente
    if (unreadCount > 0 && unreadBookingCount > 0) {
      setIsSelectorOpen(prev => !prev);
      return;
    }

    // Si SOLO hay solicitudes de particular NO LEÍDAS: abrir modal
    if (unreadBookingCount > 0 && unreadCount === 0) {
      setIsBookingModalOpen(true);
      return;
    }

    // Si ya fueron leídas o solo hay mensajes de locales o no hay nada: ir directo al chat
    goToMessages();
  };

  const goToMessages = () => {
    setIsSelectorOpen(false);
    if (userRole === 'venue') {
      navigate('/venue/messages');
    } else {
      navigate('/musician/messages');
    }
  };

  const openBookingModal = () => {
    setIsSelectorOpen(false);
    setIsBookingModalOpen(true);
  };

  return (
    <>
      {/* Selector emergente si coinciden mensajes de locales y solicitudes de particular */}
      {isSelectorOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsSelectorOpen(false)} 
          />
          <div className="fixed bottom-[9rem] right-4 md:bottom-[6.5rem] md:right-8 z-50 bg-zinc-950 border border-gold/40 rounded-xl shadow-2xl p-2 w-72 flex flex-col gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-white/50 border-b border-white/10 font-bold">
              Notificaciones pendientes
            </div>

            {/* Opción 1: Mensajes de locales */}
            <button
              onClick={goToMessages}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-white/10 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-black transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Mensajes con Locales</div>
                  <div className="text-[11px] text-white/50">Conversaciones activas</div>
                </div>
              </div>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            </button>

            {/* Opción 2: Solicitud de particular */}
            <button
              onClick={openBookingModal}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-white/10 transition-colors text-left group border border-gold/30 bg-gold/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-black transition-colors">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gold">Contratación Privada</div>
                  <div className="text-[11px] text-white/50">Desde tu web pública</div>
                </div>
              </div>
              <span className="bg-gold text-black text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingBookingCount}
              </span>
            </button>
          </div>
        </>
      )}

      {/* Botón flotante principal */}
      <button
        onClick={handleButtonClick}
        className="fixed bottom-[4.75rem] right-4 md:bottom-8 md:right-8 w-14 h-14 bg-gold hover:bg-yellow-500 text-black rounded-full shadow-2xl shadow-black/80 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-40 group cursor-pointer"
        aria-label="Abrir mensajes y solicitudes"
      >
        <MessageCircle className="w-7 h-7" />
        
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold shadow-md border-2 border-black animate-bounce">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}

        {/* Tooltip on desktop */}
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-black/90 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block">
          {unreadBookingCount > 0 && unreadCount === 0 
            ? 'Solicitud de Contratación' 
            : (totalCount > 0 ? 'Notificaciones' : 'Mensajes')}
        </span>
      </button>

      {/* Modal directo de Solicitud de Contratación */}
      <BookingRequestModal
        isOpen={isBookingModalOpen}
        requests={bookingRequests}
        onMarkAsRead={markAsRead}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </>
  );
};
