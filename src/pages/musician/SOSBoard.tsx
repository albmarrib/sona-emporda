import { useState } from 'react';
import { FiAlertTriangle, FiClock, FiMapPin, FiDollarSign, FiFilter, FiCheckCircle, FiPlus, FiX } from 'react-icons/fi';
import { mockSosUrgencies, type SosUrgency } from '../../data/mockSosData';

export const SOSBoard = () => {
  const [urgencies, setUrgencies] = useState<SosUrgency[]>(mockSosUrgencies);
  const [applied, setApplied] = useState<string[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
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

  const handleApply = (id: string) => {
    setLoadingId(id);
    // Simulamos que el músico envía su EPK a la oferta
    setTimeout(() => {
      setApplied([...applied, id]);
      setLoadingId(null);
    }, 800);
  };

  const handleCreateSos = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      const newSos: SosUrgency = {
        id: `sos-${Date.now()}`,
        title: formData.title,
        venueName: 'Mi Banda / Propio',
        location: formData.location,
        dateStr: formData.dateStr,
        price: formData.price || 'A convenir',
        requiredVibes: ['🎸 Urgente'],
        description: formData.description,
        isUrgent: true,
        postedAt: new Date().toISOString()
      };
      
      setUrgencies([newSos, ...urgencies]);
      setIsSubmitting(false);
      setIsModalOpen(false);
      setFormData({ title: '', location: '', dateStr: '', price: '', description: '' });

      // Disparar simulador global de notificaciones y WhatsApp
      const alertEvent = new CustomEvent('sos-alert', {
        detail: {
          title: newSos.title,
          message: newSos.description
        }
      });
      window.dispatchEvent(alertEvent);

    }, 1000);
  };

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
        
        <div className="flex gap-4">
          <button className="flex items-center gap-2 border border-white/20 text-white hover:text-gold hover:border-gold transition-colors px-4 py-2 text-[10px] uppercase tracking-widest font-bold">
            <FiFilter /> Filtrar
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-red-900/80 hover:bg-red-700 text-white transition-colors px-4 py-2 text-[10px] uppercase tracking-widest font-bold"
          >
            <FiPlus /> Pedir Auxilio (SOS)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {urgencies.map(sos => {
          const isApplied = applied.includes(sos.id);
          const isLoading = loadingId === sos.id;
          const isMine = sos.venueName === 'Mi Banda / Propio';

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
                {sos.requiredVibes.map((vibe, idx) => (
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
                <div className="w-full py-4 text-[10px] uppercase tracking-widest font-bold bg-white/5 text-white/40 text-center border border-white/10">
                  Esperando candidatos...
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Modal Crear SOS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-white/10 p-8 max-w-lg w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif text-white">Publicar Alerta SOS</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition-colors">
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
