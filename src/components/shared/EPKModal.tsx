import { FiX, FiStar, FiMessageSquare } from 'react-icons/fi';
import { db } from '../../firebase/firebase';
import { collection, addDoc } from 'firebase/firestore';

export const EPKModal = ({ artist, dateKey, currentUser, onClose, onContacted }: { artist: any, dateKey: string, currentUser: any, onClose: () => void, onContacted?: () => void }) => {
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

          <a 
            href={`https://wa.me/${artist.contactWhatsapp || '34600000000'}?text=${encodeURIComponent(`Hola ${artist.stageName}, te escribo desde Sona Empordà. Nos gustaría ofrecerte un bolo ${dateKey ? 'para el día ' + dateKey : 'próximamente'}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={async () => {
              alert(`Abriendo WhatsApp... Se enviará también una Alarma SOS a ${artist.stageName} en su panel de control.`);
              try {
                await addDoc(collection(db, 'sos_alerts'), {
                  title: `Propuesta de Booking Directa`,
                  venueName: currentUser?.email || 'Sala Soho',
                  location: 'Sala Soho',
                  dateStr: dateKey || 'A convenir',
                  price: 'A convenir',
                  requiredVibes: ['📅 Booking'],
                  description: `¡Hola ${artist.stageName}! Sala Soho está interesada en vuestro perfil. Por favor, revisa esta propuesta y envíanos tu EPK.`,
                  isUrgent: false,
                  postedAt: new Date().toISOString(),
                  applications: [],
                  authorId: currentUser?.uid || 'venue-123'
                });
                onClose();
                if (onContacted) onContacted();
              } catch (e) {
                console.error(e);
              }
            }}
            className="mt-4 w-full bg-gold text-black font-bold uppercase tracking-widest text-[12px] py-4 hover:bg-white transition-colors flex items-center justify-center gap-2"
          >
            <FiMessageSquare className="w-5 h-5" /> Enviar Propuesta por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};
