import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiClock, FiCheckCircle, FiUpload, FiEye, FiEyeOff, FiSearch, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { db, storage } from '../../firebase/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PushNotificationBanner } from '../../components/chat/PushNotificationBanner';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    musicianName: '',
    musicianId: '',
    ticketType: 'Entrada Libre',
    imageUrl: '', // For manual URL if they prefer
    vibes: [] as string[],
    acceptsReservations: false,
    reservationContact: ''
  });

  const availableVibes = ["Bailar", "Tardeo", "Cena", "Acústico", "Electrónica"];

  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const q = query(collection(db, 'events'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter by venueId or venueName (to support mock data that lacks venueId)
      const myEvents = eventsList.filter((e: any) => (e.venueId && e.venueId === currentUser?.uid) || (e.venueName && e.venueName === (userData?.name || 'Sala Soho')));
      
      // Sort by date descending for simple visualization
      myEvents.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEvents(myEvents);
    });
    return () => unsubscribe();
  }, [userData]);



  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  
  const handleSaveEvent = async () => {
    // Basic validation
    if(!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.musicianName) {
      alert("Por favor, rellena el título, músico, fecha y hora.");
      return;
    }

    if(!userData?.address) {
      alert("No has configurado tu dirección en 'Mi Local'. Ve a configurar tu perfil primero.");
      return;
    }

    const eventDateObj = new Date(`${newEvent.date}T${newEvent.time}`);
    const today = new Date();
    // Allow editing existing past events? Yes, but usually we don't want them to change date to past.
    // If it's a new event, block past dates.
    if (!editingEventId && eventDateObj < today) {
      alert("No puedes programar eventos en fechas pasadas.");
      return;
    }

    setIsSubmitting(true);

    let finalImageUrl = newEvent.imageUrl;

    try {
      if (imageFile) {
        // Upload to Firebase Storage
        const imageRef = ref(storage, `events/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      } else if (finalImageUrl.trim() === '') {
        finalImageUrl = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1000'; // Default music placeholder
      }

      const eventData = {
        coordinates: { lat: 41.85, lng: 3.10 },
        description: "Sin descripción por ahora.",
        title: newEvent.title,
        musicianName: newEvent.musicianName,
        musicianId: newEvent.musicianId || null,
        date: `${newEvent.date}T${newEvent.time}:00Z`,
        time: newEvent.time,
        ticketType: newEvent.ticketType,
        imageUrl: finalImageUrl,
        vibes: newEvent.vibes,
        acceptsReservations: newEvent.acceptsReservations,
        reservationContact: newEvent.acceptsReservations ? newEvent.reservationContact : '',
        venueName: userData?.name || 'Sala Soho',
        location: userData?.address || 'Dirección no definida',
        venueId: currentUser?.uid,
      };
      
      if (editingEventId) {
        await updateDoc(doc(db, 'events', editingEventId), eventData);
      } else {
        await addDoc(collection(db, 'events'), { ...eventData, status: 'published', createdAt: new Date().toISOString() });
      }
      
      closeModal();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Hubo un error al guardar el evento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  
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
    setNewEvent({
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
    setNewEvent({ title: '', date: '', time: '', musicianName: '', musicianId: '', ticketType: 'Entrada Libre', imageUrl: '', vibes: [], acceptsReservations: false, reservationContact: '' });
    setEditingEventId(null);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEventId(null);
    setImageFile(null);
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
          
          return (
            <div key={event.id} className={`py-3 border-b border-white/10 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between group hover:bg-white/5 transition-colors px-2 -mx-2 rounded-lg ${isPast ? 'opacity-50' : ''}`}>
              
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
                    {!isPast && (
                      <span className={`flex items-center gap-1 shrink-0 ${
                          event.status === 'published' ? 'text-green-500' : 
                          event.status === 'rejected' ? 'text-red-500' :
                          event.status === 'pending_musician' ? 'text-yellow-500' :
                          event.status === 'musician_accepted' ? 'text-blue-400' :
                          'text-white'
                        }`}><FiCheckCircle className="w-2.5 h-2.5" /> 
                        <span className="truncate max-w-[100px] sm:max-w-none">
                          {
                            event.status === 'published' ? 'Buscando Grupo' : 
                            event.status === 'rejected' ? 'Rechazado' :
                            event.status === 'pending_musician' ? 'Esperando Respuesta' :
                            event.status === 'musician_accepted' ? 'Músico Interesado' :
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-black border border-white/10 p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col gap-6 shadow-2xl">
              <div>
                <h2 className="text-2xl font-serif text-white mb-2">{editingEventId ? 'Editar Evento' : 'Crear Nuevo Evento'}</h2>
                <p className="text-white/50 text-xs uppercase tracking-widest">
                  Define los detalles y las etiquetas para atraer a tu público.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Título del Evento</label>
                  <input type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Ej: Noche de Jazz Acústico" className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Nombre del Artista / Grupo</label>
                  <input type="text" value={newEvent.musicianName} onChange={e => setNewEvent({...newEvent, musicianName: e.target.value})} placeholder="Ej: Marlena" className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Fecha</label>
                    <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none [color-scheme:dark]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Hora</label>
                    <input type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none [color-scheme:dark]" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Tipo de Entrada</label>
                  <select value={newEvent.ticketType} onChange={e => setNewEvent({...newEvent, ticketType: e.target.value})} className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none appearance-none cursor-pointer">
                    <option value="Entrada Libre">Entrada Libre</option>
                    <option value="Comprar Entrada">Comprar Entrada (Taquilla)</option>
                    <option value="Reservar Mesa">Reservar Mesa</option>
                  </select>
                </div>

                <div className="flex flex-col gap-4 bg-white/5 border border-white/10 p-4 mt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newEvent.acceptsReservations} 
                      onChange={e => setNewEvent({...newEvent, acceptsReservations: e.target.checked})}
                      className="w-4 h-4 accent-gold"
                    />
                    <span className="text-white/80 text-sm">¿Aceptas reservas para este evento?</span>
                  </label>
                  
                  {newEvent.acceptsReservations && (
                    <div className="flex flex-col gap-2">
                      <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Método de Reserva (Teléfono, WhatsApp, Web...)</label>
                      <input 
                        type="text" 
                        value={newEvent.reservationContact} 
                        onChange={e => setNewEvent({...newEvent, reservationContact: e.target.value})} 
                        placeholder="Ej: WhatsApp al +34 600 000 000" 
                        className="bg-black/50 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" 
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Etiqueta Principal</label>
                  <select 
                    value={newEvent.vibes[0] || ""} 
                    onChange={e => setNewEvent({...newEvent, vibes: [e.target.value]})} 
                    className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Selecciona el estilo del evento...</option>
                    {availableVibes.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Cartel / Imagen (URL o Archivo)</label>
                  <input type="text" value={newEvent.imageUrl} onChange={e => setNewEvent({...newEvent, imageUrl: e.target.value})} placeholder="Pega un enlace de imagen..." className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none mb-2" />
                  
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 text-xs hover:border-gold transition-colors text-white/80">
                      <FiUpload /> {imageFile ? 'Cambiar Imagen' : 'Subir desde dispositivo'}
                    </button>
                    {imageFile && <span className="text-xs text-green-400 truncate max-w-[200px]">{imageFile.name}</span>}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />

                  <p className="text-[9px] text-white/30 uppercase tracking-widest mt-1">Todas las fotos se renderizarán en estricto Blanco y Negro automáticamente.</p>
                </div>

              </div>

              <div className="flex gap-4 mt-4">
                <button type="button" onClick={closeModal} className="flex-1 border border-white/20 text-white/50 hover:text-white py-4 text-[10px] uppercase tracking-widest font-bold transition-colors">
                  Cancelar
                </button>
                <button type="button" onClick={handleSaveEvent} disabled={isSubmitting} className="flex-1 bg-gold hover:bg-white text-black py-4 text-[10px] uppercase tracking-widest font-bold transition-colors flex justify-center items-center">
                  {isSubmitting ? 'Guardando...' : (editingEventId ? 'Guardar Cambios' : 'Crear Evento')}
                </button>
              </div>
           </div>
        </div>
      )}

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
