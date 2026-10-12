import React, { useState } from 'react';
import { FiCalendar, FiClock, FiUser, FiPhone, FiMail, FiMessageSquare, FiCheck, FiX, FiCheckCircle } from 'react-icons/fi';
import { db } from '../../firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { BookingRequest } from '../../hooks/useBookingRequests';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface BookingRequestModalProps {
  requests: BookingRequest[];
  isOpen: boolean;
  onClose: () => void;
}

export const BookingRequestModal: React.FC<BookingRequestModalProps> = ({
  requests,
  isOpen,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!isOpen || requests.length === 0) return null;

  const currentRequest = requests[Math.min(currentIndex, requests.length - 1)];
  const contact = currentRequest?.externalContact;

  const handleAccept = async () => {
    if (!currentRequest) return;
    setProcessingId(currentRequest.id);
    try {
      // Al confirmar la propuesta externa, pasa a status 'confirmed', fijándose en su calendario
      await updateDoc(doc(db, 'events', currentRequest.id), {
        status: 'confirmed'
      });
      if (requests.length <= 1) {
        onClose();
      } else {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
      alert('Error al aceptar la solicitud');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async () => {
    if (!currentRequest) return;
    if (!window.confirm('¿Seguro que deseas descartar esta solicitud de contratación?')) return;
    setProcessingId(currentRequest.id);
    try {
      await updateDoc(doc(db, 'events', currentRequest.id), {
        status: 'rejected'
      });
      if (requests.length <= 1) {
        onClose();
      } else {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
      alert('Error al descartar la solicitud');
    } finally {
      setProcessingId(null);
    }
  };

  const cleanPhone = contact?.phone ? contact.phone.replace(/\D/g, '') : '';
  const dateFormatted = currentRequest?.date ? (() => {
    try {
      return format(parseISO(currentRequest.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    } catch {
      return currentRequest.date;
    }
  })() : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-zinc-950 border border-gold/40 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-white flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-950/40 via-zinc-900 to-zinc-950 p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold">
              <FiCalendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-gold text-black rounded">
                  Solicitud de Particular
                </span>
                {requests.length > 1 && (
                  <span className="text-xs text-white/50">
                    ({currentIndex + 1} de {requests.length})
                  </span>
                )}
              </div>
              <h3 className="text-lg font-serif text-white mt-1">
                {currentRequest.title || 'Propuesta de Contratación'}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/40 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Fecha y hora destacadas */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiCalendar className="text-gold w-5 h-5 shrink-0" />
              <div>
                <span className="text-[10px] uppercase tracking-widest text-white/40 block">Fecha solicitada</span>
                <span className="font-medium text-white capitalize">{dateFormatted}</span>
              </div>
            </div>
            {currentRequest.time && (
              <div className="flex items-center gap-2 text-white/60 text-xs border-l border-white/10 pl-4">
                <FiClock className="text-gold w-4 h-4" />
                <span>{currentRequest.time}</span>
              </div>
            )}
          </div>

          {/* Datos del contacto */}
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-widest text-white/40 block">Datos del interesado</span>
            
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <FiUser className="text-gold w-4 h-4 shrink-0" />
                <span className="font-semibold text-white">{contact?.name || currentRequest.venueName || 'Particular'}</span>
                {contact?.type && (
                  <span className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded ml-auto">
                    {contact.type}
                  </span>
                )}
              </div>

              {contact?.phone && (
                <div className="flex items-center gap-2.5 text-xs text-white/80">
                  <FiPhone className="text-gold w-4 h-4 shrink-0" />
                  <span>{contact.phone}</span>
                </div>
              )}

              {contact?.email && (
                <div className="flex items-center gap-2.5 text-xs text-white/80">
                  <FiMail className="text-gold w-4 h-4 shrink-0" />
                  <span>{contact.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mensaje / detalles */}
          {contact?.details && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-white/40 block">Mensaje / Requisitos</span>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-white/80 text-xs leading-relaxed italic whitespace-pre-wrap">
                "{contact.details}"
              </div>
            </div>
          )}

          {/* Vías de contacto directo */}
          <div className="pt-1">
            <span className="text-[10px] uppercase tracking-widest text-white/40 block mb-2">Contactar directamente</span>
            <div className="grid grid-cols-2 gap-2">
              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${contact?.name || ''}, te contacto desde Sona Empordà por tu solicitud para el ${currentRequest.date}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-colors"
                >
                  <FiMessageSquare className="w-4 h-4" /> WhatsApp
                </a>
              )}
              {contact?.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded-lg text-xs font-semibold transition-colors"
                >
                  <FiPhone className="w-4 h-4" /> Llamar
                </a>
              )}
              {contact?.email && !cleanPhone && (
                <a
                  href={`mailto:${contact.email}?subject=${encodeURIComponent(`Propuesta de concierto: ${currentRequest.title}`)}`}
                  className="col-span-2 flex items-center justify-center gap-2 py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded-lg text-xs font-semibold transition-colors"
                >
                  <FiMail className="w-4 h-4" /> Responder por Email
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-black/60 border-t border-white/10 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            disabled={processingId === currentRequest.id}
            onClick={handleAccept}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gold hover:bg-yellow-500 text-black font-bold text-xs uppercase tracking-widest rounded-lg transition-colors shadow-lg shadow-gold/20 disabled:opacity-50"
          >
            <FiCheckCircle className="w-4 h-4" />
            {processingId === currentRequest.id ? 'Guardando...' : 'Aceptar en mi Calendario'}
          </button>

          <button
            type="button"
            disabled={processingId === currentRequest.id}
            onClick={handleDecline}
            className="flex items-center justify-center gap-1.5 py-3 px-4 border border-white/15 hover:border-red-500/50 hover:bg-red-950/20 text-white/50 hover:text-red-400 font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50"
          >
            <FiX className="w-4 h-4" /> Descartar
          </button>
        </div>

        {/* Pagination if multiple requests */}
        {requests.length > 1 && (
          <div className="bg-zinc-950/90 px-4 py-2 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className="hover:text-gold disabled:opacity-30"
            >
              ← Anterior
            </button>
            <span>{currentIndex + 1} / {requests.length}</span>
            <button
              disabled={currentIndex === requests.length - 1}
              onClick={() => setCurrentIndex(prev => prev + 1)}
              className="hover:text-gold disabled:opacity-30"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
