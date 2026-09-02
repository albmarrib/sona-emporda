import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, parseISO, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiMusic, FiStar, FiMessageSquare, FiSearch, FiX, FiXCircle, FiCheckCircle } from 'react-icons/fi';
import { addDoc, collection, onSnapshot, query, where, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useEvents } from '../../hooks/useEvents';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../hooks/useChat';
import { EPKModal } from '../../components/shared/EPKModal';
import { EventFormModal } from '../../components/shared/EventFormModal';
import { useSosAlerts } from '../../hooks/useSosAlerts';
import { useNavigate } from 'react-router-dom';

// Mocked musicians to simulate explicit and implicit availability


export const VenueCalendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<any | null>(null);
  const [realMusicians, setRealMusicians] = useState<any[]>([]);
  const { findOrCreateChat, sendMessage } = useChat();
  
  useEffect(() => {
    const fetchRealMusicians = () => {
      const q = query(collection(db, 'users'), where('role', '==', 'musician'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const musicians = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            stageName: data.stageName || data.name || 'Músico Sin Nombre',
            mainGenre: data.genre || 'Varios',
            profileImageUrl: data.profileImageUrl || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400',
            rating: data.rating || 5.0,
            reviewsCount: data.reviewsCount || 1,
            calendar: data.calendar || {},
            contactWhatsapp: data.phone || ''
          };
        });
        setRealMusicians(musicians);
      }, (e) => {
        console.error("Error fetching real musicians", e);
      });
      
      return unsubscribe;
    };
    
    const unsubscribe = fetchRealMusicians();
    return () => unsubscribe();
  }, []);

  const combinedMusicians = [...realMusicians];
  
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleDayClick = (day: Date) => {
    if (selectedDate && isSameDay(day, selectedDate)) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (day < today) {
        alert("No puedes programar eventos en fechas pasadas.");
        return;
      }
      
      const dayKey = format(day, 'yyyy-MM-dd');
      const existingEvent = venueEvents.find(e => format(parseISO(e.date), 'yyyy-MM-dd') === dayKey);
      if (!existingEvent) {
         setIsNewEventModalOpen(true);
      }
    }
    setSelectedDate(day);
    // Auto-scroll on mobile
    if (window.innerWidth < 1280) {
      setTimeout(() => {
        document.getElementById('calendar-details')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };



  const { events } = useEvents(true);
  const { userData, currentUser } = useAuth();

  // Get Venue's own events
  const venueName = userData?.name || 'Sala Soho';
  const venueId = currentUser?.uid;
  const { activeSosCount } = useSosAlerts(venueId, true);
  const venueEvents = events.filter(e => e.venueId === venueId && e.status !== 'cancelled');

  const selectedDayEvent = selectedDate ? venueEvents.find(e => format(parseISO(e.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')) : null;
  const isSelectedDayPending = selectedDayEvent?.status === 'published' && !selectedDayEvent.musicianId;


  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  


  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Determine availability when a date is selected
  const dateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;

  const isMusicianBooked = (musicianId: string, dateStr: string) => {
    return events.some(e => 
      e.musicianId === musicianId && 
      (e.status === 'published' || !e.status) && 
      format(parseISO(e.date), 'yyyy-MM-dd') === dateStr
    );
  };
  const implicitlyAvailableStrict = dateKey ? combinedMusicians.filter(m => (m.calendar[dateKey] === undefined || m.calendar[dateKey] === 'free' || m.calendar[dateKey] === 'booked_partial') && !isMusicianBooked(m.id, dateKey) && !selectedDayEvent?.applicants?.includes(m.id)) : [];
  
  const applicantsList = selectedDayEvent?.applicants 
    ? combinedMusicians.filter(m => selectedDayEvent.applicants?.includes(m.id))
    : [];
  
  const searchResults = searchQuery ? implicitlyAvailableStrict.filter(a => a.stageName.toLowerCase().includes(searchQuery.toLowerCase()) || a.mainGenre.toLowerCase().includes(searchQuery.toLowerCase())) : [];


  return (
    <div className="flex flex-col xl:flex-row gap-6 md:gap-8 max-w-7xl mx-auto xl:h-[calc(100vh-8rem)] w-full">
      
      {/* Calendar Section */}
      <div className="flex-1 flex flex-col bg-black border border-white/10 p-4 md:p-6 shadow-2xl overflow-hidden w-full">
        
        <div className="flex items-start md:items-center justify-between border-b border-white/10 pb-3 mb-4 gap-2">
          <button onClick={prevMonth} className="p-1.5 md:p-2 border border-white/10 hover:border-gold text-white hover:text-gold transition-colors mt-1 md:mt-0">
            <FiChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          <div className="flex flex-col items-center flex-1">
            <h1 className="text-lg md:text-2xl font-serif text-white uppercase tracking-widest leading-none text-center">Calendario</h1>
            <p className="text-[10px] md:text-sm text-gold capitalize mt-1 md:mt-1.5">{format(currentDate, 'MMMM yyyy', { locale: es })}</p>
          </div>

          <div className="flex items-center gap-1 md:gap-2 mt-1 md:mt-0">
            <button onClick={nextMonth} className="p-1.5 md:p-2 border border-white/10 hover:border-gold text-white hover:text-gold transition-colors mr-1 md:mr-2">
              <FiChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            {activeSosCount > 0 && (
              <button 
                onClick={() => navigate('/venue/sos')}
                className="hidden md:flex items-center gap-2 bg-red-600/20 text-red-400 border border-red-500 hover:bg-red-600 hover:text-white transition-colors px-3 py-1.5 rounded-lg animate-pulse h-fit"
              >
                <span className="font-bold uppercase tracking-widest text-[10px]">¡{activeSosCount} SOS!</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-px bg-white/10 mb-1 md:mb-px w-full">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="bg-black text-center py-2 text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-white/40 truncate">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-px bg-white/10 w-full mb-4 md:mb-0">
          {Array.from({ length: getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1 }).map((_, index) => (
            <div key={`empty-${index}`} className="bg-black/50 aspect-[4/5] p-1 md:p-2" />
          ))}
          {daysInMonth.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const eventForDay = venueEvents.find(e => format(parseISO(e.date), 'yyyy-MM-dd') === dayKey);
            const hasEvent = !!eventForDay;
            const isDraft = eventForDay?.status === 'draft';

            const isPendingMusician = eventForDay?.status === 'pending_musician';
            const isMusicianAccepted = eventForDay?.status === 'musician_accepted';
            const isRejected = eventForDay?.status === 'rejected';
            
            // Retro-compatibility: if it's 'published' but has a musicianId, treat it as 'confirmed'
            const isConfirmed = eventForDay?.status === 'confirmed' || (eventForDay?.status === 'published' && eventForDay?.musicianId);
            const isPublished = eventForDay?.status === 'published' && !eventForDay?.musicianId;
            const isMusicianCancelled = eventForDay?.status === 'musician_cancelled';

            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const hasApplicants = eventForDay?.applicants && eventForDay.applicants.length > 0 && !isConfirmed;
            const hasAlert = isMusicianCancelled || hasApplicants;
            
            let cellBg = 'bg-black border border-white/5';
            let dateTextColor = isSelected ? 'text-gold font-bold' : (isToday ? 'text-blue-400 font-bold' : 'text-white/80');
            
            if (isRejected) cellBg = 'bg-red-900/40 border border-red-500/50';
            else if (isDraft) cellBg = 'bg-orange-900/40 border border-orange-500/30';
            else if (isPendingMusician) {
              cellBg = 'bg-yellow-500 border border-yellow-400';
              dateTextColor = 'text-black font-bold';
            }
            else if (isMusicianAccepted) cellBg = 'bg-blue-900/40 border border-blue-500/30';
            else if (isConfirmed) {
              cellBg = 'bg-green-500 border border-green-400';
              dateTextColor = 'text-black font-bold';
            }
            else if (isPublished) cellBg = 'bg-green-900/40 border border-green-500/30';
            else if (isMusicianCancelled) {
              cellBg = 'bg-red-600 animate-pulse border border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.6)]';
              dateTextColor = 'text-white font-bold';
            }
            
            return (
              <div 
                key={day.toString()}
                onClick={() => handleDayClick(day)}
                className={`${cellBg} aspect-[4/5] p-1 md:p-2 relative cursor-pointer hover:bg-white/5 transition-colors flex flex-col items-center justify-start gap-1 overflow-hidden ${!isCurrentMonth ? 'opacity-20' : ''} ${isToday ? 'ring-2 ring-blue-500/50 ring-inset' : ''} ${isSelected && !isPendingMusician && !isConfirmed ? 'ring-1 md:ring-2 ring-gold ring-inset z-10' : ''}`}
              >
                {hasAlert && (
                  <div className="absolute top-1 right-1 w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)] z-20"></div>
                )}
                <span className={`text-xs md:text-sm font-serif ${dateTextColor}`}>
                  {format(day, 'd')}
                </span>
                
                {hasEvent && (
                  <div className="w-full mt-auto mb-1 flex justify-center">
                    <div className="border border-white/10 text-white/70 bg-black/50 text-[8px] uppercase tracking-widest px-1 py-0.5 rounded flex items-center gap-1 justify-center w-full md:w-auto">
                      <FiMusic className="w-3 h-3 md:w-2 md:h-2 shrink-0" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-auto pt-4 flex flex-wrap gap-3 md:gap-4 text-[8px] md:text-[9px] uppercase tracking-widest text-white/50 bg-white/5 p-3 md:p-4 border border-white/10 w-full justify-center md:justify-start">
           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-green-900/40 border border-green-500/30 rounded-sm"></div>Buscando</div>
           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-yellow-500 border border-yellow-400 rounded-sm"></div>Esperando</div>
           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-blue-900/40 border border-blue-500/30 rounded-sm"></div>Interesado</div>
           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-green-500 border border-green-400 rounded-sm"></div>Cerrado</div>
           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-red-900/40 border border-red-500/50 rounded-sm"></div>Rechazado</div>
           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 border border-gold rounded-full"></div>Seleccionado</div>
        </div>
      </div>

      {/* Results Section */}
      <div id="calendar-details" className="w-full xl:w-[400px] flex flex-col bg-black border border-white/10 shrink-0 scroll-mt-20">
        {!selectedDate ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/40 min-h-[300px]">
            <FiCalendar className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">Selecciona un día en el calendario para buscar artistas disponibles para esa fecha.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 md:p-6 border-b border-white/10 bg-white/5">
              <h2 className="text-xl md:text-2xl font-serif text-white">
                {format(selectedDate, "d 'de' MMMM", { locale: es })}
              </h2>
              <p className="text-gold text-[10px] uppercase tracking-widest mt-1 font-bold">
                Candidatos Disponibles
              </p>
            </div>

            {!selectedDayEvent && selectedDate && (
              (() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selectedDate >= today) {
                  return (
                    <div className="px-4 md:px-6 pt-6">
                      <button 
                        onClick={() => {
                          setIsNewEventModalOpen(true);
                        }}
                        className="w-full bg-gold text-black font-bold uppercase tracking-widest text-[10px] py-4 hover:bg-white transition-colors"
                      >
                        Programar Nuevo Evento
                      </button>
                    </div>
                  );
                }
                return (
                   <div className="px-4 md:px-6 pt-6">
                      <div className="p-4 border border-white/10 bg-white/5 text-center text-white/50 text-xs italic">
                        No se pueden programar eventos en fechas pasadas.
                      </div>
                   </div>
                );
              })()
            )}

            {selectedDayEvent?.status === 'musician_cancelled' && (
              <div className="px-4 md:px-6 pt-6">
                <div className="bg-red-900/30 border border-red-500/50 p-4 mb-4">
                  <h3 className="text-red-400 font-bold text-sm mb-1 flex items-center gap-2"><FiXCircle /> ¡Cancelación de última hora!</h3>
                  <p className="text-white/60 text-xs leading-relaxed mb-4">
                    El grupo <strong className="text-white">{selectedDayEvent.cancelledByMusicianName || 'seleccionado'}</strong> ha cancelado su actuación a última hora.
                  </p>
                  
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={async () => {
                        import('firebase/firestore').then(({ doc, updateDoc }) => {
                          updateDoc(doc(db, 'events', selectedDayEvent.id), {
                            status: 'published'
                          });
                        });
                      }}
                      className="w-full bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600 hover:text-white font-bold uppercase tracking-widest text-[10px] py-3 transition-colors"
                    >
                      Mantener evento y buscar otra banda
                    </button>
                    <button 
                      onClick={async () => {
                        if(window.confirm('¿Estás seguro de que quieres anular el evento? Aparecerá como CANCELADO en la web pública.')) {
                          import('firebase/firestore').then(({ doc, updateDoc }) => {
                            updateDoc(doc(db, 'events', selectedDayEvent.id), {
                              status: 'cancelled'
                            });
                          });
                        }
                      }}
                      className="w-full bg-red-600 text-white font-bold uppercase tracking-widest text-[10px] py-3 hover:bg-red-500 transition-colors"
                    >
                      Anular el evento por completo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedDayEvent?.status === 'rejected' && (
              <div className="px-4 md:px-6 pt-6">
                <div className="bg-red-900/30 border border-red-500/50 p-4 mb-4">
                  <h3 className="text-red-400 font-bold text-sm mb-1 flex items-center gap-2"><FiXCircle /> ¡Oferta Rechazada!</h3>
                  <p className="text-white/60 text-xs leading-relaxed mb-4">El músico que invitaste ha declinado la oferta. Puedes marcar esto como entendido para limpiar el aviso.</p>
                  <button 
                    onClick={async () => {
                      import('firebase/firestore').then(({ doc, updateDoc }) => {
                        updateDoc(doc(db, 'events', selectedDayEvent.id), {
                          status: 'published',
                          musicianId: null,
                          musicianName: null
                        });
                      });
                    }}
                    className="w-full bg-green-600 text-white font-bold uppercase tracking-widest text-[10px] py-3 hover:bg-green-500 transition-colors"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            )}
            
            {(selectedDayEvent?.status === 'pending_musician' || selectedDayEvent?.status === 'musician_accepted') && (
              <div className="px-4 md:px-6 pt-6">
                <div className="bg-white/5 border border-white/10 p-4 mb-4">
                  <h3 className="text-white font-bold text-sm mb-1 flex items-center gap-2">Negociación Activa</h3>
                  <p className="text-white/60 text-xs leading-relaxed mb-4">Tienes una negociación abierta con {selectedDayEvent.musicianName}.</p>
                  
                  <div className="flex flex-col gap-2">
                    {selectedDayEvent?.status === 'musician_accepted' && (
                      <button 
                        onClick={async () => {
                          if(window.confirm('¿Quieres confirmar este evento? Se hará oficial y se publicará en la web.')) {
                            import('firebase/firestore').then(({ doc, updateDoc }) => {
                              updateDoc(doc(db, 'events', selectedDayEvent.id), {
                                status: 'confirmed'
                              });
                            });
                          }
                        }}
                        className="w-full bg-green-600 text-white font-bold uppercase tracking-widest text-[10px] py-3 hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
                      >
                        <FiCheckCircle className="w-4 h-4" /> Confirmar Evento
                      </button>
                    )}
                    <button 
                      onClick={async () => {
                        if(window.confirm('¿Quieres cancelar esta negociación? El evento volverá a estar buscando músicos libremente.')) {
                          import('firebase/firestore').then(({ doc, updateDoc }) => {
                            updateDoc(doc(db, 'events', selectedDayEvent.id), {
                              status: 'published',
                              musicianId: null,
                              musicianName: null
                            });
                          });
                        }
                      }}
                      className="w-full bg-red-600/20 text-red-400 border border-red-500/30 font-bold uppercase tracking-widest text-[10px] py-3 hover:bg-red-600 hover:text-white transition-colors"
                    >
                      Anular Negociación
                    </button>
                  </div>
                </div>
              </div>
            )}
            {(selectedDayEvent?.status === 'confirmed' || (selectedDayEvent?.status === 'published' && selectedDayEvent?.musicianId)) && selectedDayEvent && (
              <div className="px-4 md:px-6 pt-6">
                <div className="bg-green-900/30 border border-green-500/50 p-4 mb-4">
                  <h3 className="text-green-400 font-bold text-sm mb-1 flex items-center gap-2"><FiCheckCircle /> Banda Confirmada</h3>
                  <p className="text-white/80 font-bold text-base mb-1">{selectedDayEvent.title}</p>
                  <p className="text-white/60 text-xs leading-relaxed mb-4">Músico confirmado: <strong className="text-white">{selectedDayEvent.musicianName}</strong></p>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        setEditingEventId(selectedDayEvent.id);
                        setIsNewEventModalOpen(true);
                      }}
                      className="w-full bg-gold hover:bg-white text-black font-bold uppercase tracking-widest text-[10px] py-3 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiStar className="w-4 h-4" /> Ver / Editar Detalles
                    </button>
                    <button 
                      onClick={async () => {
                        if(window.confirm('¿Quieres cancelar este bolo? El músico recibirá un aviso automático y el evento volverá a buscar artistas.')) {
                          try {
                            const musicianIdToNotify = selectedDayEvent.musicianId;
                            import('firebase/firestore').then(async ({ doc, updateDoc }) => {
                              await updateDoc(doc(db, 'events', selectedDayEvent.id), {
                                status: 'published',
                                musicianId: null,
                                musicianName: null,
                                applicants: arrayRemove(musicianIdToNotify)
                              });
                              
                              if (musicianIdToNotify) {
                                const chatId = await findOrCreateChat(musicianIdToNotify, selectedDayEvent.id);
                                const eventDateStr = selectedDayEvent.date ? format(parseISO(selectedDayEvent.date), "d 'de' MMMM", { locale: es }) : 'próximamente';
                                const cancelMsg = `Hola, lamentamos informarte que hemos tenido que cancelar tu actuación para el evento "${selectedDayEvent.title}" del ${eventDateStr}.`;
                                await sendMessage(chatId, cancelMsg);
                              }
                            });
                          } catch(e) {
                            console.error(e);
                          }
                        }
                      }}
                      className="w-full bg-red-600/20 text-red-400 border border-red-500/30 font-bold uppercase tracking-widest text-[10px] py-3 hover:bg-red-600 hover:text-white transition-colors"
                    >
                      Cancelar Bolo
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-8">
              
              
            {selectedDate && !(selectedDayEvent?.status === 'confirmed' || (selectedDayEvent?.status === 'published' && selectedDayEvent?.musicianId)) && (
              <div className="px-4 md:px-6 pt-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input 
                    type="text" 
                    placeholder="Filtrar músicos por nombre o género..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 py-3 pl-10 pr-4 text-sm text-white focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            )}

              {searchQuery && !(selectedDayEvent?.status === 'confirmed' || (selectedDayEvent?.status === 'published' && selectedDayEvent?.musicianId)) ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-white/50 text-[10px] uppercase tracking-widest font-bold">
                    Resultados de la búsqueda ({searchResults.length})
                  </div>
                  {searchResults.length === 0 ? (
                    <p className="text-white/30 text-xs italic">No hay coincidencias.</p>
                  ) : (
                    searchResults
                      .filter(artist => artist.id !== selectedDayEvent?.cancelledByMusicianId)
                      .map(artist => {
                      const status = artist.calendar[dateKey || ''] || 'free';
                      const isBooked = dateKey ? isMusicianBooked(artist.id, dateKey) : false;
                      let badge = 'Agenda Libre';
                      let isWarning = false;
                      if (status === 'available' && !isBooked) badge = '¡Ganas de tocar!';
                      if (status === 'booked' || status === 'unavailable' || isBooked) {
                        badge = '⚠ Ocupado / No Disponible';
                        isWarning = true;
                      }
                      const isDeclined = selectedDayEvent?.declinedBy?.includes(artist.id) || false;
                      return (
                        <ArtistCard key={`srch-${artist.id}`} artist={artist} badge={isDeclined ? "HA DECLINADO" : badge} isWarning={isWarning || isDeclined} isDeclined={isDeclined} onSelect={() => setSelectedArtist(artist)} />
                      );
                    })
                  )}
                </div>
              ) : !(selectedDayEvent?.status === 'confirmed' || (selectedDayEvent?.status === 'published' && selectedDayEvent?.musicianId)) ? (
                <>
                  {/* Applicants List */}
                  {applicantsList.length > 0 && (
                    <>
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-red-400 text-[10px] uppercase tracking-widest font-bold">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></div>
                          Han postulado para tu evento ({applicantsList.length})
                        </div>
                        {applicantsList.map(artist => {
                          const isDeclined = selectedDayEvent?.declinedBy?.includes(artist.id) || false;
                          return (
                          <ArtistCard key={`app-${artist.id}`} artist={artist} badge={isDeclined ? "HA DECLINADO" : "¡Quiere este bolo!"} isWarning={true} isDeclined={isDeclined} onSelect={() => setSelectedArtist({...artist, isApplicantForEventId: selectedDayEvent?.id})} />
                          );
                        })}
                      </div>
                      <div className="h-px bg-white/10 w-full my-1"></div>
                    </>
                  )}

                  {/* Implicitly Available */}
                  <div className="flex flex-col gap-4">
                     <div className="flex items-center gap-2 text-white/50 text-[10px] uppercase tracking-widest font-bold">
                      <div className="w-2 h-2 rounded-full border border-white/50 shrink-0"></div>
                      Tienen el día libre ({implicitlyAvailableStrict.length})
                    </div>
                    
                    {implicitlyAvailableStrict.length === 0 ? (
                      <p className="text-white/30 text-xs italic">No hay más artistas libres.</p>
                    ) : (
                      implicitlyAvailableStrict
                        .filter(artist => artist.id !== selectedDayEvent?.cancelledByMusicianId)
                        .map(artist => {
                        const isDeclined = selectedDayEvent?.declinedBy?.includes(artist.id) || false;
                        return (
                          <ArtistCard key={`imp-${artist.id}`} artist={artist} badge={isDeclined ? "HA DECLINADO" : "Agenda Libre"} isWarning={isDeclined} isDeclined={isDeclined} onSelect={() => setSelectedArtist(artist)} />
                        );
                      })
                    )}
                  </div>
                </>
              ) : null}

            </div>
          </div>
        )}
      </div>




      {/* EPK Modal */}
      {selectedArtist && (
        <EPKModal 
          artist={selectedArtist} 
          dateKey={dateKey || ''} 
          currentUser={currentUser} 
          onClose={() => setSelectedArtist(null)} 
          isApplicantForEventId={selectedArtist.isApplicantForEventId}
        />
      )}

      {/* New Event Modal */}
      <EventFormModal 
        isOpen={isNewEventModalOpen}
        onClose={() => {
          setIsNewEventModalOpen(false);
          setEditingEventId(null);
        }}
        editingEventId={editingEventId}
        initialEventData={editingEventId ? events.find(e => e.id === editingEventId) : (selectedDate ? { date: format(selectedDate, 'yyyy-MM-dd') } : null)}
      />

    </div>
  );
};

// Mini component for the side cards
const ArtistCard = ({ artist, badge, isWarning, isDeclined, onSelect }: { artist: any, badge: string, isWarning?: boolean, isDeclined?: boolean, onSelect: () => void }) => {
  const imageUrl = artist.profileImageUrl || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400';
  const [contacted] = useState(false);

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeclined) return;
    onSelect();
  };
  
  return (
    <div onClick={isDeclined ? undefined : onSelect} className={`bg-zinc-950 border ${isWarning ? 'border-red-500/50' : 'border-white/10'} p-4 ${isDeclined ? 'opacity-50' : 'hover:border-gold/50 cursor-pointer group'} transition-colors flex flex-col gap-3 relative overflow-hidden`}>
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-white/10 group-hover:border-gold transition-colors">
          <img src={imageUrl} alt={artist.stageName} className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-serif text-white group-hover:text-gold transition-colors">{artist.stageName}</h3>
          <p className="text-white/50 text-[10px] uppercase tracking-widest truncate">
            {artist.mainGenre} {artist.baseLocation ? `· ${artist.baseLocation}` : ''}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
         <div className="flex items-center gap-1 text-gold">
            <FiStar className="w-3 h-3 fill-gold" />
            <span className="font-bold text-xs ml-1">{artist.rating.toFixed(1)}</span>
            <span className="text-white/40 text-[9px]">({artist.reviewsCount})</span>
          </div>
          <span className={`text-[9px] uppercase tracking-widest px-2 py-1 bg-white/5 border rounded-sm ${isWarning ? 'text-red-400 border-red-500/30' : 'text-white/70 border-white/10'}`}>
            {badge}
          </span>
      </div>

      {/* Hover action overlay */}
      {!isDeclined && (
        <div className="absolute inset-0 bg-gold/90 translate-y-full group-hover:translate-y-0 transition-transform flex items-center justify-center duration-300">
           <button onClick={handleContact} disabled={contacted} className="flex items-center gap-2 text-black font-bold text-[10px] uppercase tracking-widest">
             <FiMessageSquare className="w-4 h-4" /> {contacted ? 'Contactado' : 'Contactar y Ver EPK'}
           </button>
        </div>
      )}
    </div>
  );
}
