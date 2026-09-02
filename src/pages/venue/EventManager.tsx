import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiClock, FiCheckCircle, FiUpload, FiEye, FiEyeOff, FiSearch, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { db, storage } from '../../firebase/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { PushNotificationBanner } from '../../components/chat/PushNotificationBanner';
import { EventFormModal } from '../../components/shared/EventFormModal';

export const EventManager = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [eventToEvaluate, setEventToEvaluate] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const navigate = useNavigate();
  
  const { userData, currentUser } = useAuth();
  
  const [initialEventData, setInitialEventData] = useState<any>(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const q = query(collection(db, 'events'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsList = snapshot.docs.map(doc => {
        const data = doc.data();
        if (data.date && typeof data.date.toDate === 'function') data.date = data.date.toDate().toISOString();
        if (data.createdAt && typeof data.createdAt.toDate === 'function') data.createdAt = data.createdAt.toDate().toISOString();
        return {
          id: doc.id,
          ...data
        };
      });
      
      // Filter by venueId or venueName (to support mock data that lacks venueId)
      const myEvents = eventsList.filter((e: any) => (e.venueId && e.venueId === currentUser?.uid) || (e.venueName && e.venueName === (userData?.name || 'Sala Soho')));
      
      // Sort by date ascending for chronological visualization
      myEvents.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(myEvents);
    });
    return () => unsubscribe();
  }, [userData]);

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', id));
      setEventToDelete(null);
    } catch (e) {
      console.error(e);
      alert("Error al borrar el evento");
    }
  };




  const handleConfirmEvent = async (event: any) => {
    if (!window.confirm(`¿Estás seguro de confirmar a ${event.musicianName} para este evento? Se publicará oficialmente.`)) return;
    try {
      await updateDoc(doc(db, 'events', event.id), { status: 'confirmed' });
    } catch (e) {
      console.error(e);
      alert('Error confirmando evento.');
    }
  };

  const openEditModal = (event: any) => {
    const [dateStr, timeStr] = event.date.split('T');
    setInitialEventData({
      title: event.title || '',
      date: dateStr || '',
      time: event.time || timeStr?.substring(0, 5) || '',
      musicianName: event.musicianName || '',
      musicianId: event.musicianId || '',
      ticketType: event.ticketType || 'Entrada Libre',
      imageUrl: event.imageUrl || '',
      vibes: event.vibes || [],
      acceptsReservations: event.acceptsReservations || false,
      reservationContact: event.reservationContact || ''
    });
    setEditingEventId(event.id);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setInitialEventData(null);
    setEditingEventId(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEventId(null);
  };

  
  // Filter visible events based on showPastEvents
  const visibleEvents = events.filter(event => {
    if (showPastEvents) return true;
    return parseISO(event.date) >= new Date();
  });

  return (
    <div className="flex flex-col gap-8 max-w-5xl relative">
      <PushNotificationBanner />
      
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/venue/search')}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold bg-white/5 border border-white/10 text-white hover:border-gold hover:text-gold px-3 py-2 rounded-sm transition-colors"
          >
            <FiSearch className="w-3 h-3" /> Músicos
          </button>
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold bg-gold text-black px-3 py-2 rounded-sm hover:bg-white transition-colors"
          >
            <FiPlus className="w-3 h-3" /> Evento
          </button>
        </div>
        <button 
          onClick={() => setShowPastEvents(!showPastEvents)}
          className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
        >
          {showPastEvents ? <FiEyeOff className="w-3 h-3" /> : <FiEye className="w-3 h-3" />}
          <span className="hidden sm:inline">{showPastEvents ? 'Ocultar pasados' : 'Ver pasados'}</span>
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {visibleEvents.length === 0 && (
          <p className="text-white/40 text-sm italic">No hay eventos para mostrar.</p>
        )}
        
        {visibleEvents.map(event => {
          const eventDate = parseISO(event.date);
          const isPast = eventDate < new Date();
          const isCancelled = event.status === 'cancelled';
          
          return (
            <div key={event.id} className={`py-3 border-b flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between group transition-colors px-2 -mx-2 rounded-lg ${isPast && !isCancelled ? 'opacity-50' : ''} ${isCancelled ? 'bg-red-950/30 border-red-900/50 opacity-70' : 'border-white/10 hover:bg-white/5'}`}>
              
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto overflow-hidden">
                <div className="text-center flex flex-col items-center justify-center w-12 h-12 bg-white/5 border border-white/10 shrink-0 rounded-md">
                  <p className="text-gold text-[8px] uppercase tracking-widest">
                    {format(eventDate, "MMM", { locale: es })}
                  </p>
                  <p className="text-lg font-serif text-white leading-none mt-0.5">
                    {format(eventDate, "dd")}
                  </p>
                </div>
                
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 shrink-0 hidden sm:block">
                  <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover grayscale opacity-80" />
                </div>
                
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <h3 className="text-base sm:text-lg font-serif text-white group-hover:text-gold transition-colors truncate">{event.title}</h3>
                  </div>
                  <p className="text-gold text-[10px] sm:text-xs font-bold truncate">{event.musicianName || 'Músico Desconocido'}</p>
                  
                  <div className="flex items-center gap-3 text-white/50 text-[9px] uppercase tracking-widest mt-1">
                    <span className="flex items-center gap-1 shrink-0"><FiClock className="text-gold w-2.5 h-2.5" /> {format(eventDate, "HH:mm")}</span>
                    {(!isPast || event.status === 'cancelled') && (
                      <span className={`flex items-center gap-1 shrink-0 ${
                          event.status === 'published' ? 'text-green-500' : 
                          event.status === 'rejected' ? 'text-red-500' :
                          event.status === 'pending_musician' ? 'text-yellow-500' :
                          event.status === 'musician_accepted' ? 'text-blue-400' :
                          event.status === 'musician_cancelled' ? 'text-red-500 animate-pulse' :
                          event.status === 'cancelled' ? 'text-red-500 line-through' :
                          'text-white'
                        }`}><FiCheckCircle className="w-2.5 h-2.5" /> 
                        <span className={`truncate max-w-[100px] sm:max-w-none ${event.status === 'cancelled' ? 'font-black' : ''}`}>
                          {
                            event.status === 'published' ? 'Buscando Grupo' : 
                            event.status === 'rejected' ? 'Rechazado' :
                            event.status === 'pending_musician' ? 'Esperando Respuesta' :
                            event.status === 'musician_accepted' ? 'Músico Interesado' :
                            event.status === 'musician_cancelled' ? '¡MÚSICO CANCELÓ!' :
                            event.status === 'cancelled' ? 'CANCELADO' :
                            'Confirmado'
                          }
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

             <div className="flex items-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0 shrink-0 justify-end">
                 {isPast ? (
                   <>
                     <button 
                       onClick={() => {
                         setEventToEvaluate(event);
                         setIsRatingModalOpen(true);
                       }}
                       className="p-1.5 border border-white/20 text-gold hover:bg-gold hover:text-black rounded-sm transition-colors"
                       title="Evaluar Artista"
                     >
                       <FiCheckCircle className="w-3.5 h-3.5" />
                     </button>
                     <button onClick={() => setEventToDelete(event.id)} className="p-1.5 border border-white/20 text-white/50 hover:text-red-500 hover:border-red-500 rounded-sm transition-colors" title="Borrar Evento">
                       <FiTrash2 className="w-3.5 h-3.5" />
                     </button>
                   </>
                 ) : (
                   <>
                     {event.status === 'musician_accepted' && (
                       <button onClick={() => handleConfirmEvent(event)} className="p-1.5 bg-blue-600 text-white hover:bg-blue-500 rounded-sm transition-colors" title="Confirmar Oficialmente">
                         <FiCheckCircle className="w-3.5 h-3.5" />
                       </button>
                     )}
                     {event.status !== 'musician_accepted' && (
                       <button onClick={() => openEditModal(event)} className="p-1.5 border border-white/20 text-white/70 hover:text-gold hover:border-gold rounded-sm transition-colors" title="Editar">
                         <FiEdit2 className="w-3.5 h-3.5" />
                       </button>
                     )}
                     <button onClick={() => setEventToDelete(event.id)} className="p-1.5 border border-white/20 text-white/50 hover:text-red-500 hover:border-red-500 rounded-sm transition-colors" title="Cancelar Evento">
                       <FiTrash2 className="w-3.5 h-3.5" />
                     </button>
                   </>
                 )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal Crear Evento */}
      <EventFormModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        editingEventId={editingEventId}
        initialEventData={initialEventData}
      />

      {/* Modal Evaluación */}
      {isRatingModalOpen && eventToEvaluate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-black border border-white/10 p-6 md:p-8 max-w-lg w-full flex flex-col gap-6 shadow-2xl">
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
                <button onClick={() => setIsRatingModalOpen(false)} className="flex-1 border border-white/20 text-white/50 hover:text-white py-4 text-[10px] uppercase tracking-widest font-bold transition-colors">
                  Cancelar
                </button>
                <button onClick={() => setIsRatingModalOpen(false)} className="flex-1 bg-gold hover:bg-white text-black py-4 text-[10px] uppercase tracking-widest font-bold transition-colors">
                  Enviar Evaluación
                </button>
              </div>
           </div>
        </div>
      )}


      {/* Modal Confirmar Borrado */}
      {eventToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-black border border-white/10 p-6 md:p-8 max-w-sm w-full flex flex-col gap-6 shadow-2xl">
              <div>
                <h2 className="text-xl font-serif text-white mb-2 text-center">¿Cancelar Evento?</h2>
                <p className="text-white/50 text-xs uppercase tracking-widest text-center">
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex gap-4 mt-2">
                <button onClick={() => setEventToDelete(null)} className="flex-1 border border-white/20 text-white/50 hover:text-white py-4 text-[10px] uppercase tracking-widest font-bold transition-colors">
                  Atrás
                </button>
                <button onClick={() => handleDeleteEvent(eventToDelete)} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-4 text-[10px] uppercase tracking-widest font-bold transition-colors">
                  Sí, Cancelar
                </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
