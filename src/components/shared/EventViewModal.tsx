import React from 'react';
import { FiX, FiMapPin, FiCalendar, FiClock, FiMusic } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';


interface EventViewModalProps {
  event: any;
  onClose: () => void;
}

export const EventViewModal: React.FC<EventViewModalProps> = ({ event, onClose }) => {
  const dateObj = event.date ? parseISO(event.date) : new Date();

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Encabezado */}
        <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-sm flex justify-between items-center p-4 border-b border-white/10 z-10">
          <h3 className="text-xl font-serif text-white uppercase tracking-widest truncate max-w-[80%]">
            {event.title}
          </h3>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-2"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Imagen */}
        <div className="w-full h-48 sm:h-64 relative border-b border-white/10">
          {event.imageUrl ? (
            <img 
              src={event.imageUrl} 
              alt={event.title}
              className="w-full h-full object-cover grayscale opacity-80"
            />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center">
              <FiMusic className="w-12 h-12 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        </div>

        {/* Contenido */}
        <div className="p-6 md:p-8 space-y-8">
          {/* Detalles Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4 text-white/80">
              <div className="bg-gold/10 p-3 rounded-none border border-gold/20">
                <FiCalendar className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Fecha</p>
                <p className="font-serif text-lg">{format(dateObj, "d 'de' MMMM, yyyy", { locale: es })}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-white/80">
              <div className="bg-gold/10 p-3 rounded-none border border-gold/20">
                <FiClock className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Hora</p>
                <p className="font-serif text-lg">{format(dateObj, "HH:mm")}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-white/80 md:col-span-2">
              <div className="bg-gold/10 p-3 rounded-none border border-gold/20">
                <FiMapPin className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Ubicación</p>
                <p className="font-serif text-lg">{event.venueName}</p>
                <p className="text-white/50 text-sm mt-1">{event.venueLocation}</p>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Descripción */}
          <div className="space-y-4">
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-gold">Descripción del Evento</h4>
            <p className="text-white/70 leading-relaxed font-light text-sm md:text-base whitespace-pre-wrap">
              {event.description}
            </p>
          </div>

          {/* Condiciones si existen */}
          {event.requirements && (
            <div className="space-y-4">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-gold">Condiciones</h4>
              <div className="bg-white/5 border border-white/10 p-5">
                <p className="text-white/80 leading-relaxed font-light text-sm whitespace-pre-wrap">
                  {event.requirements}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
