import { useState, useEffect } from 'react';
import { FiAlertTriangle, FiClock, FiMapPin, FiFilter, FiPlus, FiX } from 'react-icons/fi';
import { db } from '../../firebase/firebase';
import { collection, onSnapshot, query, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useMusicianProfile } from '../../hooks/useMusicianProfile';
import { useChat } from '../../hooks/useChat';
import { useNavigate } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';

export const SOSBoard = () => {
  const { currentUser } = useAuth();
  const { profile } = useMusicianProfile();
  const [urgencies, setUrgencies] = useState<any[]>([]);
  const { findOrCreateChat, sendMessage } = useChat();
  const navigate = useNavigate();
  
  // Filtros
  const [filterMode, setFilterMode] = useState<'all' | 'mine' | 'urgent'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    dateStr: '',
    price: '',
    description: '',
    contactPhone: ''
  });

  useEffect(() => {
    // Listen to real-time SOS alerts globally
    const q = query(collection(db, 'sos_alerts'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let sosList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Filtrar propuestas directas para que no salgan en el tablón SOS
      sosList = sosList.filter((sos: any) => sos.title !== 'Propuesta de Booking Directa');
      // Sort by postedAt descending
      sosList.sort((a: any, b: any) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
      setUrgencies(sosList);
    });

    return () => unsubscribe();
  }, []);

  const openChat = async (sos: any) => {
    if (!currentUser) return;
    try {
      const template = `Hola, he visto tu alerta SOS "${sos.title}" en Sona Empordà y puedo ayudar.`;
      const chatId = await findOrCreateChat(sos.authorId);
      await sendMessage(chatId, template);
      navigate('/musician/messages', { state: { chatId } });
    } catch (e) {
      console.error(e);
      alert('Error al abrir el chat.');
    }
  };

  const handleCreateSos = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newSos = {
        title: formData.title,
        venueName: 'Mi Banda / Propio',
        location: formData.location,
        dateStr: formData.dateStr,
        price: formData.price || 'A convenir',
        requiredVibes: ['🎸 Urgente'],
        description: formData.description,
        isUrgent: true,
        postedAt: new Date().toISOString(),
        authorId: currentUser?.uid || 'musician-test',
        authorType: 'musician',
        authorPhone: formData.contactPhone || profile?.contactWhatsapp || ''
      };
      
      await addDoc(collection(db, 'sos_alerts'), newSos);
      
      setIsSubmitting(false);
      setIsModalOpen(false);
      setFormData({ title: '', location: '', dateStr: '', price: '', description: '', contactPhone: '' });

    } catch (error) {
      console.error("Error adding SOS:", error);
      setIsSubmitting(false);
    }
  };

  const filteredUrgencies = urgencies.filter(sos => {
    if (filterMode === 'mine') return sos.authorId === (currentUser?.uid || 'musician-test') || sos.venueName === 'Mi Banda / Propio';
    if (filterMode === 'urgent') return sos.isUrgent;
    return true;
  });
  const myUrgencies = filteredUrgencies.filter(sos => sos.authorId === (currentUser?.uid || 'musician-test'));
  const generalUrgencies = filteredUrgencies.filter(sos => sos.authorId !== (currentUser?.uid || 'musician-test'));

  const renderSOSCard = (sos: any, isMine: boolean) => {
    const authorLabel = sos.authorType === 'venue' ? '🏪 LOCAL' : '🎸 MÚSICO';
    const authorColor = sos.authorType === 'venue' ? 'text-blue-400' : 'text-purple-400';

    return (
      <div 
        key={sos.id} 
        className={`bg-black border p-4 flex flex-col gap-4 transition-colors ${
          sos.isUrgent ? 'border-red-900/50 hover:border-red-500' : 'border-white/10 hover:border-gold'
        } ${isMine ? 'ring-1 ring-gold/30' : ''}`}
      >
        
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-serif text-white">{sos.title}</h3>
              {sos.isUrgent && (
                <span className="text-red-500 text-[8px] uppercase tracking-widest font-bold animate-pulse">
                  🚨 URGENCIA
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isMine && (
                <span className="text-gold text-[8px] uppercase tracking-widest font-bold">
                  Tu anuncio
                </span>
              )}
              {!isMine && sos.authorType && (
                <span className={`${authorColor} text-[8px] uppercase tracking-widest font-bold`}>
                  {authorLabel}
                </span>
              )}
              <span className="text-white/40 text-[10px]">&bull; {sos.authorType === 'venue' ? sos.venueName : 'Banda / Músico'}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-white/70 leading-relaxed line-clamp-3">
          {sos.description}
        </p>

        <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3 mt-auto">
          <div className="flex items-center gap-1.5 text-white/60">
            <FiClock className="text-gold w-3 h-3" />
            <span className="text-[10px] truncate">{sos.dateStr}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/60">
            <FiMapPin className="text-gold w-3 h-3" />
            <span className="text-[10px] truncate">{sos.location}</span>
          </div>
        </div>

        {!isMine && (
          <button 
            onClick={() => openChat(sos)}
            className="w-full py-2.5 text-[9px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 bg-green-900/30 border border-green-500/50 hover:bg-green-600 text-white mt-1"
          >
            <FaWhatsapp className="w-4 h-4" /> Hablar por Chat
          </button>
        )}

        {isMine && (
          <button 
            onClick={async () => {
              if(window.confirm('¿Estás seguro de que quieres cancelar y borrar esta alerta SOS?')) {
                try {
                  await deleteDoc(doc(db, 'sos_alerts', sos.id));
                } catch(e) {
                  console.error(e);
                }
              }
            }} 
            className="w-full py-2.5 bg-red-900/20 border border-red-900 text-red-500 hover:bg-red-900 hover:text-white transition-colors text-[9px] uppercase tracking-widest font-bold flex justify-center items-center mt-1"
          >
            Cancelar Alerta
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white mb-2 flex items-center gap-3">
            <FiAlertTriangle className="text-red-500 animate-pulse" /> 
            Tablón SOS
          </h1>
          <p className="text-white/50 text-xs uppercase tracking-widest">Avisos urgentes de locales y bandas</p>
        </div>
        
        <div className="flex gap-4 relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 border border-white/10 hover:border-gold transition-colors px-4 py-2 text-[10px] uppercase tracking-widest text-white/70 hover:text-white"
          >
            <FiFilter /> Filtrar
          </button>

          {isFilterOpen && (
            <div className="absolute top-full right-auto left-0 md:left-auto md:right-1/2 mt-2 w-48 bg-black border border-white/10 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
              <button 
                onClick={() => { setFilterMode('all'); setIsFilterOpen(false); }}
                className={`w-full text-left px-4 py-3 text-[10px] uppercase tracking-widest hover:bg-white/5 transition-colors ${filterMode === 'all' ? 'text-gold font-bold' : 'text-white'}`}
              >
                Todos los Anuncios
              </button>
              <button 
                onClick={() => { setFilterMode('urgent'); setIsFilterOpen(false); }}
                className={`w-full text-left px-4 py-3 text-[10px] uppercase tracking-widest hover:bg-white/5 transition-colors ${filterMode === 'urgent' ? 'text-gold font-bold' : 'text-white'}`}
              >
                Solo Urgencias
              </button>
            </div>
          )}

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-red-900/80 hover:bg-red-700 text-white transition-colors px-4 py-2 text-[10px] uppercase tracking-widest font-bold"
          >
            <FiPlus /> Pedir Auxilio
          </button>
        </div>
      </div>



      <div className="flex flex-col gap-12">
        {myUrgencies.length > 0 && (
          <div>
            <h2 className="text-xl font-serif text-white mb-6 border-b border-white/10 pb-2">Tus Alertas SOS Activas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myUrgencies.map(sos => renderSOSCard(sos, true))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-serif text-white mb-6 border-b border-white/10 pb-2">Tablón General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {generalUrgencies.length === 0 && (
              <p className="text-white/40 italic col-span-2">No hay anuncios que coincidan con este filtro.</p>
            )}
            {generalUrgencies.map(sos => renderSOSCard(sos, false))}
          </div>
        </div>
      </div>

      {/* Modal Crear SOS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl md:text-2xl font-serif text-white">Publicar Alerta SOS</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition-colors mt-1 md:mt-0">
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSos} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Título corto (Ej: Sustituto bajista)</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Cuándo</label>
                  <input required type="text" placeholder="Ej: Hoy 22:00h" value={formData.dateStr} onChange={e => setFormData({...formData, dateStr: e.target.value})} className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Dónde</label>
                  <input required type="text" placeholder="Ej: Palamós" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Condiciones / Pago (Opcional)</label>
                <input type="text" placeholder="Ej: Repartimos taquilla, 100€..." value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Detalles (Qué necesitas exactamente)</label>
                <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none resize-none"></textarea>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Teléfono de Contacto Urgente</label>
                <input type="text" placeholder="Ej: +34 600 000 000" value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" />
                <p className="text-[9px] text-white/30 uppercase tracking-widest mt-1">Opcional. Si lo dejas en blanco, se usará el WhatsApp de tu perfil.</p>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="mt-4 bg-red-900/80 hover:bg-red-700 text-white font-bold py-4 text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Publicando...' : 'Lanzar Alerta SOS al ecosistema'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
