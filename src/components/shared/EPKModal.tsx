import { FiX, FiStar, FiMessageSquare, FiCalendar } from 'react-icons/fi';
import { db } from '../../firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useEvents } from '../../hooks/useEvents';
import { useState, useEffect } from 'react';

export const EPKModal = ({ artist, dateKey, currentUser, onClose, onContacted }: { artist: any, dateKey?: string, currentUser: any, onClose: () => void, onContacted?: () => void }) => {
  const { events } = useEvents(true); // true to include drafts
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  const venueOpenEvents = events.filter(e => 
    (e.venueId === currentUser?.uid || e.venueName === currentUser?.email) && 
    (e.status === 'published' || e.status === 'draft') && 
    !e.musicianId
  );

  // Auto-select event if dateKey matches
  useEffect(() => {
    if (dateKey && venueOpenEvents.length > 0) {
      const matchingEvent = venueOpenEvents.find(e => e.date && e.date.startsWith(dateKey));
      if (matchingEvent && !selectedEventId) {
        setSelectedEventId(matchingEvent.id);
      }
    }
  }, [dateKey, venueOpenEvents, selectedEventId]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-gold hover:text-black transition-colors z-30">
          <span className="text-xl font-bold px-2 py-1 leading-none"><FiX /></span>
        </button>

        <div className="h-64 relative">
          <img src={artist.profileImageUrl || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=1600'} alt={artist.stageName} className="w-full h-full object-cover grayscale opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
          <div className="absolute bottom-6 left-6">
            <h2 className="text-4xl font-serif text-white">{artist.stageName}</h2>
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col gap-6">
          <div className="flex gap-2">
              <span className="bg-white/5 border border-white/10 px-3 py-1 text-[10px] uppercase tracking-widest text-white/70">
                {artist.mainGenre}
              </span>
          </div>

          <div>
            <h3 className="text-[10px] uppercase tracking-widest text-white/50 mb-2">EPK DEL ARTISTA (Biografía)</h3>
            <p className="text-white/80 text-sm leading-relaxed">{artist.shortBio || "No hay biografía disponible."}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 border border-white/10">
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-white/50">Formación</h4>
              <p className="text-lg text-white font-serif capitalize">
                {artist.formationType || "Solista"} {artist.membersCount ? `(${artist.membersCount} personas)` : ''}
              </p>
              {artist.membersNames && <p className="text-xs text-white/50 mt-1">{artist.membersNames}</p>}
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-white/50">Valoración</h4>
              <div className="flex items-center gap-1 text-gold">
                <FiStar className="fill-gold w-4 h-4" />
                <span className="text-lg text-white font-serif">{artist.rating || 5.0}</span>
                <span className="text-xs text-white/50">({artist.reviewsCount || 0} res)</span>
              </div>
            </div>
          </div>

          {(artist.youtubeUrl || artist.spotifyUrl) && (
            <div>
              <h3 className="text-[10px] uppercase tracking-widest text-white/50 mb-3">ENLACES MULTIMEDIA</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                {artist.youtubeUrl && (
                  <a href={artist.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-red-600/20 text-red-500 border border-red-600/50 hover:bg-red-600 hover:text-white transition-colors py-3 flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-bold">
                    Ver Video Destacado
                  </a>
                )}
                {artist.spotifyUrl && (
                  <a href={artist.spotifyUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-500/20 text-green-500 border border-green-500/50 hover:bg-green-500 hover:text-white transition-colors py-3 flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-bold">
                    Escuchar en Spotify
                  </a>
                )}
              </div>
            </div>
          )}

          {artist.technicalRider && (
            <div>
              <h3 className="text-[10px] uppercase tracking-widest text-white/50 mb-2">TECHNICAL RIDER (Necesidades)</h3>
              <div className="bg-white/5 border border-white/10 p-4">
                <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{artist.technicalRider}</p>
              </div>
            </div>
          )}
          
          {(artist.contactPhone || artist.contactWhatsapp) && (
             <div>
              <h3 className="text-[10px] uppercase tracking-widest text-white/50 mb-2">CONTACTO PRIVADO</h3>
              <div className="bg-white/5 border border-white/10 p-4 text-white/80 text-sm">
                {artist.contactPhone && <p>Tel: {artist.contactPhone}</p>}
                {artist.contactWhatsapp && <p>WhatsApp: {artist.contactWhatsapp}</p>}
              </div>
            </div>
          )}

            <div className="mt-4 border-t border-white/10 pt-6">
              <h3 className="text-[10px] uppercase tracking-widest text-gold mb-3 flex items-center gap-2">
                <FiCalendar /> Invitar a un Evento
              </h3>
              
              {venueOpenEvents.length === 0 ? (
                <div className="bg-white/5 border border-white/10 p-4 text-sm text-white/50 text-center">
                  No tienes eventos publicados o en borrador buscando músicos. Crea uno en tu calendario primero.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <select 
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none"
                  >
                    <option value="" className="bg-black">-- Selecciona un evento --</option>
                    {venueOpenEvents.map(evt => (
                      <option key={evt.id} value={evt.id} className="bg-black">
                        {evt.title} ({evt.date})
                      </option>
                    ))}
                  </select>

                  <button 
                    disabled={!selectedEventId}
                    onClick={async () => {
                      if (!selectedEventId) return;
                      
                      const selectedEvt = venueOpenEvents.find(e => e.id === selectedEventId);
                      const evtDate = selectedEvt?.date || 'próximamente';

                      const confirmMsg = `¿Estás seguro de invitar a ${artist.stageName} a tu evento "${selectedEvt?.title}"?`;
                      if (!window.confirm(confirmMsg)) return;

                      try {
                        // Update the existing event
                        await updateDoc(doc(db, 'events', selectedEventId), {
                          status: 'pending_musician',
                          musicianId: artist.id,
                          musicianName: artist.stageName
                        });
                        
                        onClose();
                        if (onContacted) onContacted();

                        // Open WhatsApp
                        const waText = encodeURIComponent(`¡Hola ${artist.stageName}! Te escribo desde Sona Empordà. Te he enviado una invitación oficial para tocar en nuestro evento "${selectedEvt?.title}" el ${evtDate}. Por favor, entra en la app y acéptala si te interesa.`);
                        window.open(`https://wa.me/${artist.contactWhatsapp || '34600000000'}?text=${waText}`, '_blank');

                      } catch (e) {
                        console.error(e);
                        alert('Error al invitar al músico.');
                      }
                    }}
                    className={`w-full font-bold uppercase tracking-widest text-[12px] py-4 transition-colors flex items-center justify-center gap-2 ${
                      selectedEventId ? 'bg-gold text-black hover:bg-white' : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    <FiMessageSquare className="w-5 h-5" /> Invitar y Abrir WhatsApp
                  </button>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};
