import { useState } from 'react';
import { FiPlus, FiCalendar, FiClock, FiMapPin, FiCheckCircle } from 'react-icons/fi';
import { mockEvents } from '../../data/mockEvents';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const EventManager = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [eventToEvaluate, setEventToEvaluate] = useState<any>(null);

  return (
    <div className="flex flex-col gap-8 max-w-5xl relative">
      
      <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white mb-2">Programación del Local</h1>
          <p className="text-white/50 text-xs uppercase tracking-widest">Gestiona tus eventos, horarios y artistas contratados</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gold hover:bg-white text-black transition-colors px-6 py-3 text-[10px] uppercase tracking-widest font-bold"
        >
          <FiPlus className="w-4 h-4" /> Crear Nuevo Evento
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {mockEvents.map(event => {
          const eventDate = parseISO(event.date);
          const isPast = eventDate < new Date();
          
          return (
            <div key={event.id} className={`bg-zinc-950 border border-white/10 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group hover:border-gold/30 transition-colors ${isPast ? 'opacity-50' : ''}`}>
              
              <div className="flex items-center gap-6">
                <div className="text-center w-16">
                  <p className="text-gold text-[10px] uppercase tracking-widest">
                    {format(eventDate, "MMM", { locale: es })}
                  </p>
                  <p className="text-3xl font-serif text-white">
                    {format(eventDate, "dd")}
                  </p>
                </div>
                
                <div className="w-16 h-16 rounded-full overflow-hidden bg-white/5 shrink-0 hidden md:block">
                  <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-serif text-white group-hover:text-gold transition-colors">{event.title}</h3>
                    {!isPast && (
                      <span className="bg-green-900/30 text-green-500 border border-green-900 px-2 py-0.5 text-[8px] uppercase tracking-widest flex items-center gap-1">
                        <FiCheckCircle /> Confirmado
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-white/50 text-xs">
                    <span className="flex items-center gap-1"><FiCalendar className="text-gold" /> {format(eventDate, "EEEE", { locale: es })}</span>
                    <span className="flex items-center gap-1"><FiClock className="text-gold" /> {format(eventDate, "HH:mm")}h</span>
                    <span className="flex items-center gap-1"><FiMapPin className="text-gold" /> {event.venueName}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                 {isPast ? (
                   <button 
                     onClick={() => {
                       setEventToEvaluate(event);
                       setIsRatingModalOpen(true);
                     }}
                     className="flex-1 md:flex-none bg-gold text-black hover:bg-white px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors flex items-center justify-center gap-2"
                   >
                     Evaluar Artista
                   </button>
                 ) : (
                   <>
                     <button className="flex-1 md:flex-none border border-white/20 text-white hover:text-gold hover:border-gold px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors">
                       Editar
                     </button>
                     <button className="flex-1 md:flex-none border border-white/20 text-white/50 hover:text-red-500 hover:border-red-500 px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors">
                       Cancelar
                     </button>
                   </>
                 )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal Placeholder */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-zinc-950 border border-white/10 p-8 max-w-lg w-full flex flex-col items-center justify-center text-center gap-6">
              <h2 className="text-2xl font-serif text-white">Crear Evento</h2>
              <p className="text-white/50 text-sm">
                En esta fase, la creación de eventos se automatiza conectando con el Agente Booking IA, que genera el evento directamente tras cerrar el trato con el músico.
              </p>
              <button onClick={() => setIsModalOpen(false)} className="mt-4 border border-gold text-gold hover:bg-gold hover:text-black py-2 px-8 text-[10px] uppercase tracking-widest font-bold transition-colors">
                Cerrar
              </button>
           </div>
        </div>
      )}

      {/* Modal Evaluación */}
      {isRatingModalOpen && eventToEvaluate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-zinc-950 border border-white/10 p-8 max-w-lg w-full flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-serif text-white mb-2">Evaluar al Artista</h2>
                <p className="text-white/50 text-xs uppercase tracking-widest">
                  Evento: {eventToEvaluate.title}
                </p>
              </div>

              <div className="flex flex-col gap-4 bg-white/5 p-4 border border-white/10">
                <p className="text-sm text-white/80 text-center">¿Cómo de satisfecho estás con el artista?</p>
                <div className="flex justify-center gap-2 text-gold">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} className="hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 fill-current opacity-30 hover:opacity-100" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Comentarios adicionales</label>
                <textarea rows={3} placeholder="¿Cómo fue la puntualidad, el trato, el sonido...?" className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none resize-none"></textarea>
              </div>

              <div className="flex gap-4 mt-2">
                <button onClick={() => setIsRatingModalOpen(false)} className="flex-1 border border-white/20 text-white/50 hover:text-white py-3 text-[10px] uppercase tracking-widest font-bold transition-colors">
                  Cancelar
                </button>
                <button onClick={() => setIsRatingModalOpen(false)} className="flex-1 bg-gold hover:bg-white text-black py-3 text-[10px] uppercase tracking-widest font-bold transition-colors">
                  Enviar Evaluación
                </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
