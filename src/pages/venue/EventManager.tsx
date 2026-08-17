import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiClock, FiMapPin, FiCheckCircle, FiUpload, FiEye, FiEyeOff } from 'react-icons/fi';
import { db, storage } from '../../firebase/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';

export const EventManager = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [eventToEvaluate, setEventToEvaluate] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [showPastEvents, setShowPastEvents] = useState(false);
  
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

  const toggleVibe = (tag: string) => {
    setNewEvent(prev => ({
      ...prev,
      vibes: prev.vibes.includes(tag) 
        ? prev.vibes.filter(t => t !== tag)
        : [...prev.vibes, tag]
    }));
  };

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
      
      <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white mb-2">Programación del Local</h1>
          <p className="text-white/50 text-xs uppercase tracking-widest">Gestiona tus eventos, horarios y artistas contratados</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto mt-2 md:mt-0">
          <button 
            onClick={() => setShowPastEvents(!showPastEvents)}
            className="flex items-center justify-center gap-2 border border-white/20 hover:border-gold hover:text-gold text-white/70 transition-colors w-12 h-12 md:w-10 md:h-10 text-lg md:text-xl"
            title={showPastEvents ? "Ocultar pasados" : "Ver pasados"}
          >
            {showPastEvents ? <FiEyeOff /> : <FiEye />}
          </button>
          
          <button 
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 bg-gold hover:bg-white text-black transition-colors px-6 py-4 md:py-3 text-[10px] md:text-xs uppercase tracking-widest font-bold w-full md:w-auto"
          >
            <FiPlus className="w-4 h-4" /> Crear Nuevo Evento
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {visibleEvents.length === 0 && (
          <p className="text-white/40 text-sm italic">No hay eventos para mostrar.</p>
        )}
        
        {visibleEvents.map(event => {
          const eventDate = parseISO(event.date);
          const isPast = eventDate < new Date();
          
          return (
            <div key={event.id} className={`bg-black border border-white/10 p-5 md:p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group hover:border-gold/30 transition-colors ${isPast ? 'opacity-50' : ''}`}>
              
              <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto cursor-pointer">
                <div className="text-center flex flex-col items-center justify-center w-14 h-14 bg-white/5 border border-white/10 shrink-0">
                  <p className="text-gold text-[9px] uppercase tracking-widest">
                    {format(eventDate, "MMM", { locale: es })}
                  </p>
                  <p className="text-xl font-serif text-white">
                    {format(eventDate, "dd")}
                  </p>
                </div>
                
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 shrink-0 hidden md:block">
                  <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover grayscale opacity-80" />
                </div>
                
                  <div className="flex flex-col gap-1 overflow-hidden min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg md:text-xl font-serif text-white group-hover:text-gold transition-colors truncate">{event.title}</h3>
                    {!isPast && (
                      <span className={`hidden sm:flex px-2 py-0.5 text-[8px] uppercase tracking-widest items-center gap-1 shrink-0 transition-colors ${
                        event.status === 'published' ? 'bg-green-900/30 text-green-500 border border-green-900' : 
                        event.status === 'rejected' ? 'bg-red-900/30 text-red-500 border border-red-900' :
                        event.status === 'pending_musician' ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-900' :
                        event.status === 'musician_accepted' ? 'bg-blue-900/30 text-blue-400 border border-blue-900' :
                        'bg-green-900 text-white font-bold'
                      }`}>
                        <FiCheckCircle /> {
                          event.status === 'published' ? 'Buscando Grupo' : 
                          event.status === 'rejected' ? 'Rechazado' :
                          event.status === 'pending_musician' ? '⏳ Esperando Respuesta' :
                          event.status === 'musician_accepted' ? '🎉 Músico Interesado' :
                          'Confirmado'
                        }
                      </span>
                    )}
                  </div>
                  <p className="text-gold text-xs font-bold mb-1 truncate">{event.musicianName || 'Músico Desconocido'}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-white/50 text-[10px] uppercase tracking-widest truncate">
                    <span className="flex items-center gap-1 shrink-0"><FiClock className="text-gold w-3 h-3" /> {format(eventDate, "HH:mm")}h</span>
                    <span className="hidden sm:flex items-center gap-1 shrink-0"><FiMapPin className="text-gold w-3 h-3" /> {event.venueName}</span>
                    <span className={`flex sm:hidden items-center gap-1 shrink-0 ${
                        event.status === 'published' ? 'text-green-500' : 
                        event.status === 'rejected' ? 'text-red-500' :
                        event.status === 'pending_musician' ? 'text-yellow-500' :
                        event.status === 'musician_accepted' ? 'text-blue-400' :
                        'text-white'
                      }`}><FiCheckCircle className="w-3 h-3" /> {event.status}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0 shrink-0">
                 {isPast ? (
                   <button 
                     onClick={() => {
                       setEventToEvaluate(event);
                       setIsRatingModalOpen(true);
                     }}
                     className="flex-1 md:flex-none bg-gold text-black hover:bg-white px-4 py-3 md:py-2 text-[10px] uppercase tracking-widest font-bold transition-colors flex items-center justify-center gap-2"
                   >
                     Evaluar Artista
                   </button>
                 ) : (
                   <>
                     {event.status === 'musician_accepted' && (
                       <button onClick={() => handleConfirmEvent(event)} className="flex-1 md:flex-none bg-blue-600 text-white hover:bg-blue-500 px-4 py-3 md:py-2 text-[10px] uppercase tracking-widest font-bold transition-colors">
                         Confirmar Oficialmente
                       </button>
                     )}
                     {event.status !== 'musician_accepted' && (
                       <button onClick={() => openEditModal(event)} className="flex-1 md:flex-none border border-white/20 text-white hover:text-gold hover:border-gold px-4 py-3 md:py-2 text-[10px] uppercase tracking-widest font-bold transition-colors">
                         Editar
                       </button>
                     )}
                     <button onClick={() => setEventToDelete(event.id)} className="flex-1 md:flex-none border border-white/20 text-white/50 hover:text-red-500 hover:border-red-500 px-4 py-3 md:py-2 text-[10px] uppercase tracking-widest font-bold transition-colors">
                       Cancelar
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Nombre del Artista / Grupo</label>
                    <input type="text" value={newEvent.musicianName} onChange={e => setNewEvent({...newEvent, musicianName: e.target.value})} placeholder="Ej: Marlena" className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">ID del Artista (Si está registrado)</label>
                    <input type="text" value={newEvent.musicianId} onChange={e => setNewEvent({...newEvent, musicianId: e.target.value})} placeholder="Opcional. Ej: musician-123" className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" />
                  </div>
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
                  <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold flex items-center justify-between">
                    Etiquetas (Multiselección)
                  </label>
                  <div className="flex flex-wrap gap-2 bg-white/5 p-4 border border-white/10">
                    {availableVibes.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleVibe(tag)}
                        className={`px-3 py-2 text-[10px] uppercase tracking-widest transition-colors border ${
                          newEvent.vibes.includes(tag)
                            ? 'bg-gold/20 border-gold text-gold font-bold'
                            : 'bg-transparent border-white/20 text-white/50 hover:border-white/50 hover:text-white'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
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
