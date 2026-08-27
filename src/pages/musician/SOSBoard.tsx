import { useState, useEffect } from 'react';
import { FiAlertTriangle, FiClock, FiMapPin, FiFilter, FiPlus, FiX, FiMessageSquare, FiUsers } from 'react-icons/fi';
import { db } from '../../firebase/firebase';
import { collection, onSnapshot, query, addDoc, doc, deleteDoc, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useMusicianProfile } from '../../hooks/useMusicianProfile';
import { useChat } from '../../hooks/useChat';
import { useNavigate } from 'react-router-dom';

export const SOSBoard = () => {
  const { currentUser } = useAuth();
  const { profile } = useMusicianProfile();
  const [urgencies, setUrgencies] = useState<any[]>([]);
  const { findOrCreateChat, sendMessage } = useChat();
  const navigate = useNavigate();
  
  const [filterMode, setFilterMode] = useState<'all' | 'mine' | 'urgent' | 'collaboration'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'sos' as 'sos' | 'collaboration',
    location: '',
    dateStr: '',
    price: '',
    description: '',
    contactPhone: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'sos_alerts'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let sosList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      sosList = sosList.filter((sos: any) => sos.title !== 'Propuesta de Booking Directa');
      sosList.sort((a: any, b: any) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
      setUrgencies(sosList);
    });

    return () => unsubscribe();
  }, []);

  const openChat = async (sos: any) => {
    if (!currentUser) return;
    try {
      const template = `Hola, he visto tu anuncio "${sos.title}" en el Tablón de Sona Empordà y me interesa.`;
      const chatId = await findOrCreateChat(sos.authorId);
      await sendMessage(chatId, template);
      navigate('/musician/messages', { state: { chatId } });
    } catch (e) {
      console.error(e);
      alert('Error al abrir el chat.');
    }
  };

  const [musicians, setMusicians] = useState<any[]>([]);
  const [musicianSearchQuery, setMusicianSearchQuery] = useState('');
  const [selectedMusician, setSelectedMusician] = useState<any | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'musician'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMusicians(list.filter(m => m.id !== currentUser?.uid));
    });
    return () => unsubscribe();
  }, [currentUser]);

  const filteredMusicians = musicianSearchQuery.trim() === '' ? [] : musicians.filter(m => 
    (m.stageName || m.name || '').toLowerCase().includes(musicianSearchQuery.toLowerCase()) || 
    (m.mainGenre || '').toLowerCase().includes(musicianSearchQuery.toLowerCase())
  );

  const handleCreateSos = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formattedDate = formData.dateStr ? new Date(formData.dateStr).toLocaleString('es-ES', { 
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
      }) + 'h' : '';

      const newSos = {
        title: formData.title,
        type: formData.type,
        status: 'active',
        venueName: 'Mi Banda / Propio',
        location: formData.location,
        dateStr: formattedDate,
        price: formData.price || 'A convenir',
        requiredVibes: formData.type === 'sos' ? ['🎸 Urgente'] : ['🤝 Colaboración'],
        description: formData.description,
        isUrgent: formData.type === 'sos',
        postedAt: new Date().toISOString(),
        authorId: currentUser?.uid || 'musician-test',
        authorType: 'musician',
        authorPhone: formData.contactPhone || profile?.contactWhatsapp || ''
      };
      
      await addDoc(collection(db, 'sos_alerts'), newSos);
      
      setIsSubmitting(false);
      setIsModalOpen(false);
      setFormData({ title: '', type: 'sos', location: '', dateStr: '', price: '', description: '', contactPhone: '' });

      if (selectedMusician) {
        // Direct chat as well as public SOS
        const template = `Hola ${selectedMusician.stageName || selectedMusician.name}, te contacto directamente para el anuncio que acabo de publicar en el tablón: "${formData.title}". ¿Estás disponible?`;
        const chatId = await findOrCreateChat(selectedMusician.id);
        await sendMessage(chatId, template);
        navigate('/musician/messages', { state: { chatId } });
      }

    } catch (error) {
      console.error("Error adding notice:", error);
      setIsSubmitting(false);
    }
  };

  const filteredUrgencies = urgencies.filter(sos => {
    if (filterMode === 'mine') return sos.authorId === (currentUser?.uid || 'musician-test') || sos.venueName === 'Mi Banda / Propio';
    if (filterMode === 'urgent') return sos.type === 'sos' || sos.isUrgent;
    if (filterMode === 'collaboration') return sos.type === 'collaboration' && !sos.isUrgent;
    return true;
  });
  
  const myUrgencies = filteredUrgencies.filter(sos => sos.authorId === (currentUser?.uid || 'musician-test'));
  const generalUrgencies = filteredUrgencies.filter(sos => sos.authorId !== (currentUser?.uid || 'musician-test'));

  const renderSOSCard = (sos: any, isMine: boolean) => {
    const authorLabel = sos.authorType === 'venue' ? '🏪 LOCAL' : '🎸 MÚSICO';
    const authorColor = sos.authorType === 'venue' ? 'text-blue-400' : 'text-purple-400';
    const isCollab = sos.type === 'collaboration' && !sos.isUrgent;

    return (
      <div 
        key={sos.id} 
        className={`bg-black border p-4 flex flex-col gap-4 transition-colors relative overflow-hidden ${
          !isCollab ? 'border-red-900/50 hover:border-red-500' : 'border-white/10 hover:border-gold'
        } ${isMine ? 'ring-1 ring-gold/30' : ''}`}
      >
        {!isCollab && <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>}
        
        <div className="flex justify-between items-start relative z-10">
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center justify-between w-full">
              <h3 className="text-lg font-serif text-white">{sos.title}</h3>
              {!isCollab ? (
                <span className="text-red-500 text-[8px] uppercase tracking-widest font-bold animate-pulse flex items-center gap-1">
                  <FiAlertTriangle /> URGENCIA
                </span>
              ) : (
                <span className="text-green-400 text-[8px] uppercase tracking-widest font-bold flex items-center gap-1">
                  <FiUsers /> BÚSQUEDA
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

        <p className="text-xs text-white/70 leading-relaxed line-clamp-3 relative z-10">
          {sos.description}
        </p>

        <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3 mt-auto relative z-10">
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
            className="w-full py-2.5 text-[9px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 bg-white/5 border border-white/20 hover:bg-gold hover:border-gold hover:text-black text-white mt-1 relative z-10"
          >
            <FiMessageSquare className="w-4 h-4" /> Hablar por Chat
          </button>
        )}

        {isMine && (
          <button 
            onClick={async () => {
              if(window.confirm('¿Estás seguro de que quieres cancelar y borrar este anuncio?')) {
                try {
                  await deleteDoc(doc(db, 'sos_alerts', sos.id));
                } catch(e) {
                  console.error(e);
                }
              }
            }} 
            className="w-full py-2.5 bg-red-900/20 border border-red-900 text-red-500 hover:bg-red-900 hover:text-white transition-colors text-[9px] uppercase tracking-widest font-bold flex justify-center items-center mt-1 relative z-10"
          >
            Eliminar Anuncio
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
            <FiUsers className="text-gold" /> 
            Tablón de Músicos
          </h1>
          <p className="text-white/50 text-xs uppercase tracking-widest">Colaboraciones, búsquedas y alertas SOS</p>
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
                Solo SOS Urgentes
              </button>
              <button 
                onClick={() => { setFilterMode('collaboration'); setIsFilterOpen(false); }}
                className={`w-full text-left px-4 py-3 text-[10px] uppercase tracking-widest hover:bg-white/5 transition-colors ${filterMode === 'collaboration' ? 'text-gold font-bold' : 'text-white'}`}
              >
                Solo Búsquedas
              </button>
            </div>
          )}

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white/10 border border-white/20 hover:bg-white hover:text-black text-white transition-colors px-4 py-2 text-[10px] uppercase tracking-widest font-bold"
          >
            <FiPlus /> Publicar Anuncio
          </button>
        </div>
      </div>



      <div className="flex flex-col gap-12">
        {myUrgencies.length > 0 && (
          <div>
            <h2 className="text-xl font-serif text-white mb-6 border-b border-white/10 pb-2">Tus Anuncios Activos</h2>
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl md:text-2xl font-serif text-white">Publicar Anuncio</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition-colors mt-1 md:mt-0">
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSos} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-2 mb-2">
                <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Tipo de Anuncio</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: 'collaboration'})}
                    className={`py-3 px-4 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border ${formData.type === 'collaboration' ? 'bg-gold text-black border-gold' : 'bg-white/5 text-white/50 border-white/10 hover:text-white'}`}
                  >
                    <FiUsers /> Búsqueda Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: 'sos'})}
                    className={`py-3 px-4 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border ${formData.type === 'sos' ? 'bg-red-600 text-white border-red-500' : 'bg-white/5 text-white/50 border-white/10 hover:text-white'}`}
                  >
                    <FiAlertTriangle /> Alerta SOS
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 relative">
                <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold flex justify-between">
                  <span>¿Buscas a un músico en concreto? (Opcional)</span>
                  {selectedMusician && <span className="text-gold">Seleccionado</span>}
                </label>
                {selectedMusician ? (
                  <div className="bg-white/10 border border-gold p-3 flex justify-between items-center">
                    <div>
                      <p className="text-white font-bold">{selectedMusician.stageName || selectedMusician.name}</p>
                      <p className="text-white/50 text-[10px] uppercase tracking-widest">{selectedMusician.mainGenre}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedMusician(null)} className="text-white/50 hover:text-white p-1">
                      <FiX />
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={musicianSearchQuery}
                    onChange={(e) => setMusicianSearchQuery(e.target.value)}
                    className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none"
                  />
                )}
                {filteredMusicians.length > 0 && !selectedMusician && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-zinc-900 border border-white/10 shadow-xl z-50">
                    {filteredMusicians.map(m => (
                      <div 
                        key={m.id} 
                        className="p-3 hover:bg-white/10 cursor-pointer border-b border-white/5"
                        onClick={() => { setSelectedMusician(m); setMusicianSearchQuery(''); }}
                      >
                        <p className="text-white text-sm font-bold">{m.stageName || m.name}</p>
                        <p className="text-white/50 text-[10px] uppercase tracking-widest">{m.mainGenre}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>


              <div className="flex flex-col gap-2">
                <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Título corto</label>
                <input required type="text" placeholder={formData.type === 'sos' ? "Ej: Bajista URGENTE para esta noche" : "Ej: Busco trompetista para bolo en agosto"} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Cuándo</label>
                  <input required type="datetime-local" value={formData.dateStr} onChange={e => setFormData({...formData, dateStr: e.target.value})} className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none [color-scheme:dark]" />
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

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`mt-4 font-bold py-4 text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${selectedMusician ? 'bg-gold text-black hover:bg-white' : (formData.type === 'sos' ? 'bg-red-900/80 hover:bg-red-700 text-white' : 'bg-gold text-black hover:bg-white')}`}
              >
                {isSubmitting ? 'Procesando...' : (selectedMusician ? `Publicar y Chatear con ${selectedMusician.stageName || selectedMusician.name}` : (formData.type === 'sos' ? 'Lanzar Alerta SOS' : 'Publicar Anuncio'))}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
