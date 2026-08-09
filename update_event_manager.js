import fs from 'fs';

let content = fs.readFileSync('src/pages/venue/EventManager.tsx', 'utf8');

// 1. Add imports for deleteDoc, doc, updateDoc
content = content.replace(
  "import { collection, query, onSnapshot, addDoc } from 'firebase/firestore';",
  "import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';"
);

// 2. Add editing state
content = content.replace(
  "const [isSubmitting, setIsSubmitting] = useState(false);",
  "const [isSubmitting, setIsSubmitting] = useState(false);\n  const [editingEventId, setEditingEventId] = useState<string | null>(null);"
);

// 3. Update handleCreateEvent to handle editing and drafting
const newHandleCreateEvent = `
  const handleSaveEvent = async () => {
    // Basic validation
    if(!newEvent.title || !newEvent.date || !newEvent.time) {
      alert("Por favor, rellena el título, fecha y hora.");
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
        const imageRef = ref(storage, \`events/\${Date.now()}_\${imageFile.name}\`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      } else if (finalImageUrl.trim() === '') {
        finalImageUrl = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1000'; // Default music placeholder
      }

      const eventData = {
        coordinates: { lat: 41.85, lng: 3.10 },
        description: "Sin descripción por ahora.",
        title: newEvent.title,
        date: \`\${newEvent.date}T\${newEvent.time}:00Z\`,
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
        await addDoc(collection(db, 'events'), { ...eventData, status: 'draft', createdAt: new Date().toISOString() });
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
    if (confirm("¿Estás seguro de que deseas cancelar/borrar este evento?")) {
      try {
        await deleteDoc(doc(db, 'events', id));
      } catch (e) {
        console.error(e);
        alert("Error al borrar el evento");
      }
    }
  };

  const handleToggleStatus = async (event: any) => {
    const newStatus = event.status === 'published' ? 'draft' : 'published';
    try {
      await updateDoc(doc(db, 'events', event.id), { status: newStatus });
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (event: any) => {
    const [dateStr, timeStr] = event.date.split('T');
    setNewEvent({
      title: event.title || '',
      date: dateStr || '',
      time: event.time || timeStr?.substring(0, 5) || '',
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
    setNewEvent({ title: '', date: '', time: '', ticketType: 'Entrada Libre', imageUrl: '', vibes: [], acceptsReservations: false, reservationContact: '' });
    setEditingEventId(null);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEventId(null);
    setImageFile(null);
  };
`;
content = content.replace(/const handleCreateEvent = async \(\) => \{[\s\S]*?setIsSubmitting\(false\);\n    \}\n  \};/, newHandleCreateEvent);

// 4. Update modal button onClick
content = content.replace(
  "onClick={() => setIsModalOpen(true)}",
  "onClick={openCreateModal}"
);

// 5. Update the list rendering to show status
content = content.replace(
  /{!isPast && \(\s*<span className="hidden sm:flex bg-green-900\/30 text-green-500 border border-green-900 px-2 py-0.5 text-\[8px\] uppercase tracking-widest items-center gap-1 shrink-0">\s*<FiCheckCircle \/> Confirmado\s*<\/span>\s*\)}/g,
  `{!isPast && (
                      <span className={\`hidden sm:flex px-2 py-0.5 text-[8px] uppercase tracking-widest items-center gap-1 shrink-0 cursor-pointer border transition-colors \${event.status === 'published' ? 'bg-green-900/30 text-green-500 border-green-900 hover:bg-green-900/50' : 'bg-orange-900/30 text-orange-500 border-orange-900 hover:bg-orange-900/50'}\`} onClick={() => handleToggleStatus(event)} title="Haz clic para cambiar estado">
                        <FiCheckCircle /> {event.status === 'published' ? 'Publicado' : 'Borrador'}
                      </span>
                    )}`
);

content = content.replace(
  /<span className="flex sm:hidden items-center gap-1 text-green-500 shrink-0"><FiCheckCircle className="w-3 h-3" \/> OK<\/span>/g,
  `<span className={\`flex sm:hidden items-center gap-1 shrink-0 \${event.status === 'published' ? 'text-green-500' : 'text-orange-500'}\`} onClick={() => handleToggleStatus(event)}><FiCheckCircle className="w-3 h-3" /> {event.status === 'published' ? 'PUB' : 'BOR'}</span>`
);

// 6. Update action buttons
content = content.replace(
  /<button className="flex-1 md:flex-none border border-white\/20 text-white hover:text-gold hover:border-gold px-4 py-3 md:py-2 text-\[10px\] uppercase tracking-widest font-bold transition-colors">\s*Editar\s*<\/button>\s*<button className="flex-1 md:flex-none border border-white\/20 text-white\/50 hover:text-red-500 hover:border-red-500 px-4 py-3 md:py-2 text-\[10px\] uppercase tracking-widest font-bold transition-colors">\s*Cancelar\s*<\/button>/g,
  `<button onClick={() => openEditModal(event)} className="flex-1 md:flex-none border border-white/20 text-white hover:text-gold hover:border-gold px-4 py-3 md:py-2 text-[10px] uppercase tracking-widest font-bold transition-colors">
                       Editar
                     </button>
                     <button onClick={() => handleDeleteEvent(event.id)} className="flex-1 md:flex-none border border-white/20 text-white/50 hover:text-red-500 hover:border-red-500 px-4 py-3 md:py-2 text-[10px] uppercase tracking-widest font-bold transition-colors">
                       Cancelar
                     </button>`
);

// 7. Update Modal texts
content = content.replace(
  /<h2 className="text-2xl font-serif text-white mb-2">Crear Nuevo Evento<\/h2>/g,
  `<h2 className="text-2xl font-serif text-white mb-2">{editingEventId ? 'Editar Evento' : 'Crear Nuevo Evento'}</h2>`
);

content = content.replace(
  /<button type="button" onClick=\{handleCreateEvent\} disabled=\{isSubmitting\} className="flex-1 bg-gold hover:bg-white text-black py-4 text-\[10px\] uppercase tracking-widest font-bold transition-colors flex justify-center items-center">\s*\{isSubmitting \? 'Creando\.\.\.' : 'Crear Evento'\}\s*<\/button>/g,
  `<button type="button" onClick={handleSaveEvent} disabled={isSubmitting} className="flex-1 bg-gold hover:bg-white text-black py-4 text-[10px] uppercase tracking-widest font-bold transition-colors flex justify-center items-center">
                  {isSubmitting ? 'Guardando...' : (editingEventId ? 'Guardar Cambios' : 'Crear Evento')}
                </button>`
);

content = content.replace(
  /onClick=\{\(\) => setIsModalOpen\(false\)\}/g,
  `onClick={closeModal}`
);


fs.writeFileSync('src/pages/venue/EventManager.tsx', content);
