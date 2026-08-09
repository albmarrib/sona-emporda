import { useState, useEffect } from 'react';
import { FiAlertTriangle, FiClock, FiMapPin, FiDollarSign, FiFilter, FiCheckCircle, FiPlus, FiX } from 'react-icons/fi';
import { db } from '../../firebase/firebase';
import { collection, onSnapshot, query, addDoc, doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

export const SOSBoard = () => {
  const { currentUser } = useAuth();
  const [urgencies, setUrgencies] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
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
    description: ''
  });

  useEffect(() => {
    // Listen to real-time SOS alerts globally
    const q = query(collection(db, 'sos_alerts'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sosList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by postedAt descending
      sosList.sort((a: any, b: any) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
      setUrgencies(sosList);
    });

    return () => unsubscribe();
  }, []);

  const handleApply = async (id: string) => {
    setLoadingId(id);
    try {
      const sosRef = doc(db, 'sos_alerts', id);
      await updateDoc(sosRef, {
        applications: arrayUnion(currentUser?.uid || 'musician-test')
      });
    } catch (error) {
      console.error("Error applying to SOS:", error);
    } finally {
      setLoadingId(null);
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
        applications: [],
        authorId: currentUser?.uid || 'musician-test'
      };
      
      await addDoc(collection(db, 'sos_alerts'), newSos);
      
      setIsSubmitting(false);
      setIsModalOpen(false);
      setFormData({ title: '', location: '', dateStr: '', price: '', description: '' });

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

  return (
    <div className="flex flex-col gap-8 max-w-5xl relative">
      
      <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white mb-2 flex items-center gap-3">
            <FiAlertTriangle className="text-red-500" />
            Tablón SOS
          </h1>
          <p className="text-white/50 text-xs uppercase tracking-widest">
            Urgencias y sustituciones de última hora en locales o grupos de tu zona.
          </p>
        </div>
        
        <div className="flex gap-4 relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 border transition-colors px-4 py-2 text-[10px] uppercase tracking-widest font-bold ${
              filterMode !== 'all' ? 'border-gold text-gold' : 'border-white/20 text-white hover:border-gold'
            }`}
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
              <button 
                onClick={() => { setFilterMode('mine'); setIsFilterOpen(false); }}
                className={`w-full text-left px-4 py-3 text-[10px] uppercase tracking-widest hover:bg-white/5 transition-colors border-t border-white/10 ${filterMode === 'mine' ? 'text-gold font-bold' : 'text-white'}`}
              >
                Mis Anuncios
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredUrgencies.length === 0 && (
          <p className="text-white/40 italic col-span-2">No hay anuncios que coincidan con este filtro.</p>
        )}
        {filteredUrgencies.map(sos => {
          const isApplied = sos.applications?.includes(currentUser?.uid || 'musician-test');
          const isLoading = loadingId === sos.id;
          const isMine = sos.authorId === (currentUser?.uid || 'musician-test') || sos.venueName === 'Mi Banda / Propio';

          return (
            <div 
              key={sos.id} 
              className={`bg-black border p-6 flex flex-col gap-6 transition-colors ${
                sos.isUrgent ? 'border-red-900/50 hover:border-red-500' : 'border-white/10 hover:border-gold'
              } ${isMine ? 'ring-1 ring-gold/30' : ''}`}
            >
              
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  {sos.isUrgent && (
                    <span className="text-red-500 text-[9px] uppercase tracking-widest font-bold animate-pulse mb-1">
                      🚨 URGENCIA ALTA
                    </span>
                  )}
                  {isMine && (
                    <span className="text-gold text-[9px] uppercase tracking-widest font-bold mb-1">
                      Tu anuncio
                    </span>
                  )}
                  <h3 className="text-xl font-serif text-white">{sos.title}</h3>
                  <p className="text-white/40 text-xs">{sos.venueName}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {sos.requiredVibes?.map((vibe: string, idx: number) => (
                  <span key={idx} className="bg-white/5 border border-white/10 px-2 py-1 text-[10px] uppercase tracking-widest text-gold">
                    {vibe}
                  </span>
                ))}
              </div>

              <p className="text-sm text-white/70 leading-relaxed">
                {sos.description}
              </p>

              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-auto">
                <div className="flex items-center gap-2 text-white/60">
                  <FiClock className="text-gold" />
                  <span className="text-xs">{sos.dateStr}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <FiMapPin className="text-gold" />
                  <span className="text-xs">{sos.location}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60 col-span-2">
                  <FiDollarSign className="text-gold" />
                  <span className="text-xs font-bold text-white">{sos.price} <span className="text-white/40 font-normal">honorarios estimados</span></span>
                </div>
              </div>

              {!isMine && (
                <button 
                  onClick={() => !isApplied && handleApply(sos.id)}
                  disabled={isApplied || isLoading}
                  className={`w-full py-4 text-[10px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 ${
                    isApplied 
                      ? 'bg-green-900/30 text-green-500 border border-green-900 cursor-default' 
                      : isLoading
                        ? 'bg-white/10 text-white cursor-wait'
                        : 'bg-gold text-black hover:bg-white'
                  }`}
                >
                  {isApplied ? (
                    <>
                      <FiCheckCircle className="w-4 h-4" /> EPK Enviado
                    </>
                  ) : isLoading ? (
                    'Enviando...'
                  ) : (
                    'Enviar mi EPK'
                  )}
                </button>
              )}

              {isMine && (
                <div className="flex flex-col gap-2 w-full mt-2">
                  <div className="bg-white/5 border border-white/10 p-2 text-center text-xs text-white">
                    <span className="font-bold text-gold">{sos.applications?.length || 0}</span> Candidatos Aplicados
                  </div>
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
                    className="w-full py-3 bg-red-900/20 border border-red-900 text-red-500 hover:bg-red-900 hover:text-white transition-colors text-[9px] uppercase tracking-widest font-bold flex justify-center items-center"
                  >
                    Cancelar Alerta
                  </button>
                </div>
              )}

            </div>
          );
        })}
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
