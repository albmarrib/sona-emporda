import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiClock, FiMapPin, FiMessageSquare, FiX, FiCheckCircle } from 'react-icons/fi';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../hooks/useChat';
import { format, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export const MusicianDirectBookingAlert: React.FC = () => {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const { findOrCreateChat } = useChat();
  const [pendingNotices, setPendingNotices] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser || userRole !== 'musician') {
      setPendingNotices([]);
      return;
    }

    const q = query(
      collection(db, 'events'),
      where('musicianId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const today = startOfDay(new Date());
      const notices = snapshot.docs
        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as any))
        .filter(event => {
          if (!event.directMusicianNotice || event.musicianDismissedNotice) return false;
          if (event.status === 'cancelled' || event.status === 'musician_cancelled') return false;
          if (!event.date) return false;
          try {
            return parseISO(event.date) >= today;
          } catch {
            return false;
          }
        });

      // Ordenar por fecha más próxima primero
      notices.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setPendingNotices(notices);
    });

    return () => unsubscribe();
  }, [currentUser, userRole]);

  if (pendingNotices.length === 0) return null;

  const currentNotice = pendingNotices[0];

  const handleDismiss = async () => {
    try {
      await updateDoc(doc(db, 'events', currentNotice.id), {
        musicianDismissedNotice: true,
        musicianDismissedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error al descartar aviso:', e);
    }
  };

  const handleGoToCalendar = async () => {
    await handleDismiss();
    navigate('/musician/calendar');
  };

  const handleOpenChat = async () => {
    await handleDismiss();
    if (currentNotice.venueId && currentNotice.venueId !== 'external_booking') {
      try {
        const chatId = await findOrCreateChat(currentNotice.venueId, currentNotice.id);
        navigate('/musician/messages', { state: { chatId } });
        return;
      } catch (e) {
        console.error('Error al abrir chat:', e);
      }
    }
    navigate('/musician/messages');
  };

  let formattedDate = currentNotice.date;
  try {
    formattedDate = format(parseISO(currentNotice.date), "EEEE d 'de' MMMM", { locale: es });
  } catch {}

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-gold/40 p-6 md:p-8 max-w-md w-full shadow-2xl relative rounded-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-4">
        
        {/* Botón cerrar esquina */}
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-white/40 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          title="Cerrar aviso"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Cabecera con Icono */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center mb-3 text-gold shadow-[0_0_20px_rgba(212,175,55,0.25)]">
            <FiCalendar className="w-7 h-7" />
          </div>

          <span className="bg-gold text-black font-extrabold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full mb-2">
            ¡Nuevo Concierto Programado!
          </span>

          <h3 className="text-xl md:text-2xl font-serif text-white font-bold">
            {currentNotice.venueName || 'Un local'}
          </h3>
          <p className="text-white/60 text-xs mt-1 leading-relaxed">
            Ha confirmado directamente una actuación contigo para el evento:
          </p>
        </div>

        {/* Tarjeta con los datos del evento */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col gap-2.5 text-xs text-white">
          <div className="font-bold text-sm text-gold">
            "{currentNotice.title}"
          </div>

          <div className="flex items-center gap-2 text-white/80">
            <FiCalendar className="text-gold w-4 h-4 shrink-0" />
            <span className="capitalize font-medium">{formattedDate}</span>
          </div>

          {currentNotice.time && (
            <div className="flex items-center gap-2 text-white/80">
              <FiClock className="text-gold w-4 h-4 shrink-0" />
              <span>{currentNotice.time}h</span>
            </div>
          )}

          {currentNotice.location && (
            <div className="flex items-center gap-2 text-white/70">
              <FiMapPin className="text-gold w-4 h-4 shrink-0" />
              <span className="truncate">{currentNotice.location}</span>
            </div>
          )}

          <div className="mt-2 pt-2.5 border-t border-white/10 text-[10px] text-amber-200/90 flex items-start gap-1.5 leading-snug">
            <FiCheckCircle className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
            <span>
              <strong>Tu agenda ha quedado reservada</strong> para este día. Si necesitas permitir doblete o cancelarlo, puedes gestionarlo libremente desde tu Agenda.
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col gap-2.5 mt-1">
          <button
            onClick={handleGoToCalendar}
            className="w-full bg-gold hover:bg-white text-black font-extrabold uppercase tracking-widest text-[11px] py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <FiCalendar className="w-4 h-4" /> Ver en mi Agenda
          </button>

          <button
            onClick={handleOpenChat}
            className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/15 font-bold uppercase tracking-widest text-[11px] py-3 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <FiMessageSquare className="w-4 h-4 text-gold" /> Abrir Chat con el Local
          </button>

          <button
            onClick={handleDismiss}
            className="text-white/40 hover:text-white text-xs mt-1 transition-colors text-center cursor-pointer"
          >
            Entendido, gracias
          </button>
        </div>

      </div>
    </div>
  );
};

