import { useState, useEffect, useRef } from 'react';
import { FiUpload, FiX } from 'react-icons/fi';
import { db, storage } from '../../firebase/firebase';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEventId?: string | null;
  initialEventData?: any;
  onSuccess?: () => void;
}

export const EventFormModal = ({ isOpen, onClose, editingEventId, initialEventData, onSuccess }: EventFormModalProps) => {
  const { userData, currentUser } = useAuth();
  const { settings } = useSettings();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [musiciansList, setMusiciansList] = useState<any[]>([]);
  const [showMusicianDropdown, setShowMusicianDropdown] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '21:00',
    musicianName: '',
    musicianId: '',
    ticketType: 'Entrada Libre',
    imageUrl: '',
    vibes: [] as string[],
    acceptsReservations: false,
    reservationContact: ''
  });

  // Fetch musicians for autocomplete
  useEffect(() => {
    if (!isOpen) return;
    const q = query(collection(db, 'users'), where('role', '==', 'musician'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMusiciansList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [isOpen]);

  // Set initial data
  useEffect(() => {
    if (isOpen) {
      if (initialEventData) {
        setNewEvent({
          title: initialEventData.title || '',
          date: initialEventData.date || '',
          time: initialEventData.time || '21:00',
          musicianName: initialEventData.musicianName || '',
          musicianId: initialEventData.musicianId || '',
          ticketType: initialEventData.ticketType || 'Entrada Libre',
          imageUrl: initialEventData.imageUrl || '',
          vibes: initialEventData.vibes || [],
          acceptsReservations: initialEventData.acceptsReservations || false,
          reservationContact: initialEventData.reservationContact || ''
        });
      } else {
        setNewEvent({ 
          title: '', date: '', time: '21:00', musicianName: '', musicianId: '', 
          ticketType: 'Entrada Libre', imageUrl: '', vibes: [], 
          acceptsReservations: false, reservationContact: '' 
        });
      }
      setImageFile(null);
    }
  }, [isOpen, initialEventData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSaveEvent = async () => {
    if(!newEvent.title || !newEvent.date || !newEvent.time) {
      alert("Por favor, rellena el título, fecha y hora.");
      return;
    }

    if(!userData?.address) {
      alert("No has configurado tu dirección en 'Mi Local'. Ve a configurar tu perfil primero.");
      return;
    }

    const eventDateObj = new Date(`${newEvent.date}T${newEvent.time}`);
    const today = new Date();
    if (!editingEventId && eventDateObj < today) {
      alert("No puedes programar eventos en fechas pasadas.");
      return;
    }

    setIsSubmitting(true);
    let finalImageUrl = newEvent.imageUrl;

    try {
      if (imageFile) {
        const imageRef = ref(storage, `events/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      } else if (finalImageUrl.trim() === '') {
        finalImageUrl = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1000';
      }

      let lat = 41.85;
      let lng = 3.10;
      if (userData?.address) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(userData.address)}`);
          const data = await res.json();
          if (data && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
          }
        } catch (e) {
          console.error("Geocoding failed", e);
        }
      }

      const eventData = {
        coordinates: { lat, lng },
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
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Hubo un error al guardar el evento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
       <div className="bg-black border border-white/10 p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col gap-6 shadow-2xl relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
            <FiX className="w-6 h-6" />
          </button>
          
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

            <div className="flex flex-col gap-2 relative">
              <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Nombre del Artista / Grupo (Opcional)</label>
              <input 
                type="text" 
                value={newEvent.musicianName} 
                onChange={e => {
                  setNewEvent({...newEvent, musicianName: e.target.value, musicianId: ''});
                  setShowMusicianDropdown(true);
                }}
                onFocus={() => setShowMusicianDropdown(true)}
                onBlur={() => setTimeout(() => setShowMusicianDropdown(false), 200)}
                placeholder="Escribe para buscar o déjalo en blanco..." 
                className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" 
              />
              {showMusicianDropdown && newEvent.musicianName && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-950 border border-white/10 shadow-2xl z-50 max-h-48 overflow-y-auto">
                  {musiciansList
                    .filter(m => {
                      const matchesName = (m.stageName || m.name || '').toLowerCase().includes(newEvent.musicianName.toLowerCase());
                      const status = newEvent.date ? m.calendar?.[newEvent.date] : 'free';
                      const isUnavailable = status === 'unavailable' || status === 'booked_full' || status === 'booked';
                      return matchesName && !isUnavailable;
                    })
                    .map(m => (
                      <div 
                        key={m.id} 
                        onClick={() => {
                          setNewEvent({...newEvent, musicianName: m.stageName || m.name, musicianId: m.id});
                          setShowMusicianDropdown(false);
                        }}
                        className="p-3 hover:bg-white/10 cursor-pointer text-sm text-white border-b border-white/5 last:border-0 flex items-center gap-3"
                      >
                        <img src={m.profileImageUrl || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=100'} alt="pic" className="w-8 h-8 rounded-full object-cover grayscale" />
                        {m.stageName || m.name}
                      </div>
                  ))}
                </div>
              )}
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
                  <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Método de Reserva (Teléfono, WhatsApp...)</label>
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
                <option value="" disabled className="bg-zinc-950 text-white/50">Selecciona el estilo del evento...</option>
                {settings.vibes.map(tag => (
                  <option key={tag} value={tag} className="bg-zinc-950 text-white">{tag}</option>
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
            <button type="button" onClick={onClose} className="flex-1 border border-white/20 text-white/50 hover:text-white py-4 text-[10px] uppercase tracking-widest font-bold transition-colors">
              Cancelar
            </button>
            <button type="button" onClick={handleSaveEvent} disabled={isSubmitting} className="flex-1 bg-gold hover:bg-white text-black py-4 text-[10px] uppercase tracking-widest font-bold transition-colors flex justify-center items-center">
              {isSubmitting ? 'Guardando...' : (editingEventId ? 'Guardar Cambios' : 'Crear Evento')}
            </button>
          </div>
       </div>
    </div>
  );
};
