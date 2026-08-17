import { FiMessageSquare, FiCalendar, FiMapPin, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { db } from '../../firebase/firebase';
import { updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../hooks/useEvents';

export const DirectOffers = () => {
  const { currentUser } = useAuth();
  const { events } = useEvents(true);

  // Filtrar los eventos donde soy el músico y el estado es pending_musician o musician_accepted
  // Añadimos una excepción para IDs de prueba ('musician-') para que se puedan probar los perfiles falsos
  const offers = events.filter(e => 
    (e.musicianId === currentUser?.uid || (e.musicianId && e.musicianId.startsWith('musician-'))) && 
    (e.status === 'pending_musician' || e.status === 'musician_accepted')
  );

  const handleUpdateStatus = async (id: string, action: 'accept' | 'decline') => {
    try {
      if (action === 'accept') {
        await updateDoc(doc(db, 'events', id), {
          status: 'musician_accepted'
        });
      } else {
        const offer = offers.find(o => o.id === id);
        const declinedId = offer?.musicianId || currentUser?.uid;
        await updateDoc(doc(db, 'events', id), {
          status: 'rejected',
          musicianId: null,
          musicianName: null,
          declinedBy: arrayUnion(declinedId)
        });
      }
    } catch (e) {
      console.error(e);
      alert("Error actualizando la propuesta.");
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl h-[calc(100vh-8rem)]">
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-serif text-white mb-2 flex items-center gap-3">
          <FiMessageSquare className="text-gold" />
          Invitaciones a Eventos
        </h1>
        <p className="text-white/50 text-xs uppercase tracking-widest">
          Locales que te han invitado a tocar en sus eventos
        </p>
      </div>

      {offers.length === 0 ? (
        <div className="text-center py-20 bg-black border border-white/10">
          <FiMessageSquare className="w-12 h-12 text-gold mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-serif text-white mb-2">Sin invitaciones de momento</h3>
          <p className="text-white/40 text-sm">Cuando un local te invite a un evento, aparecerá aquí.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {offers.map(offer => (
            <div key={offer.id} className="bg-black border border-white/10 p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center hover:border-gold/30 transition-colors group">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-1 ${
                    offer.status === 'musician_accepted' ? 'bg-green-900/30 text-green-500 border border-green-500/30' :
                    'bg-gold/10 text-gold border border-gold/30'
                  }`}>
                    {offer.status === 'musician_accepted' ? 'Has Aceptado (Esperando Local)' : 'Pendiente de tu respuesta'}
                  </span>
                  <span className="text-white/40 text-xs">{offer.venueName}</span>
                </div>
                <h3 className="text-xl font-serif text-white mb-1">{offer.title}</h3>
                <div className="flex gap-4 text-xs text-white/50 mt-3">
                  <span className="flex items-center gap-1"><FiCalendar className="text-gold" /> {offer.date} {offer.time}</span>
                  <span className="flex items-center gap-1"><FiMapPin className="text-gold" /> {offer.location}</span>
                </div>
              </div>

              {offer.status === 'pending_musician' ? (
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto shrink-0 mt-4 md:mt-0">
                  <button 
                    onClick={() => handleUpdateStatus(offer.id, 'accept')}
                    className="flex items-center justify-center gap-2 bg-green-900/80 hover:bg-green-700 text-white transition-colors px-4 py-3 text-[10px] uppercase tracking-widest font-bold"
                  >
                    <FiCheckCircle /> Me Interesa
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(offer.id, 'decline')}
                    className="flex items-center justify-center gap-2 border border-white/20 hover:border-red-500 hover:text-red-500 text-white/50 transition-colors px-4 py-3 text-[10px] uppercase tracking-widest font-bold"
                  >
                    <FiXCircle /> Declinar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto shrink-0 mt-4 md:mt-0">
                  <button 
                    onClick={() => handleUpdateStatus(offer.id, 'decline')}
                    className="flex items-center justify-center gap-2 border border-red-500/30 bg-red-900/20 hover:bg-red-900/50 hover:text-red-300 text-red-500/80 transition-colors px-4 py-3 text-[10px] uppercase tracking-widest font-bold"
                  >
                    <FiXCircle /> Anular Acuerdo
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
