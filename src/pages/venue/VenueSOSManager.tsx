import { useState } from 'react';
import { FiAlertTriangle, FiPlus, FiX, FiCheckCircle } from 'react-icons/fi';
import { mockSosUrgencies, type SosUrgency } from '../../data/mockSosData';

export const VenueSOSManager = () => {
  // Mostramos SOLO los SOS creados por este local (filtramos por nombre)
  const [urgencies, setUrgencies] = useState<SosUrgency[]>(mockSosUrgencies.filter(u => u.venueName === 'Sala Soho'));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    dateStr: '',
    price: '',
    description: ''
  });

  const handleCreateSos = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      const newSos: SosUrgency = {
        id: `sos-${Date.now()}`,
        title: formData.title,
        venueName: 'Sala Soho',
        location: 'Palamós',
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
      setFormData({ title: '', dateStr: '', price: '', description: '' });

      const alertEvent = new CustomEvent('sos-alert', {
        detail: { title: newSos.title, message: newSos.description }
      });
      window.dispatchEvent(alertEvent);
    }, 1000);
  };

  const handleCancelSos = (id: string) => {
    if(confirm('¿Seguro que quieres cancelar esta alerta?')) {
      setUrgencies(urgencies.filter(u => u.id !== id));
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      
      <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white mb-2 flex items-center gap-3">
            <FiAlertTriangle className="text-red-500" />
            Mis Alertas SOS
          </h1>
          <p className="text-white/50 text-xs uppercase tracking-widest">
            Gestiona las urgencias activas de tu local
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-red-900/80 hover:bg-red-700 text-white transition-colors px-6 py-3 text-[10px] uppercase tracking-widest font-bold"
        >
          <FiPlus className="w-4 h-4" /> Lanzar Pánico SOS
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {urgencies.length === 0 ? (
          <div className="text-center py-20 bg-zinc-950 border border-white/10">
            <FiCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-serif text-white mb-2">Todo bajo control</h3>
            <p className="text-white/40 text-sm">No tienes ninguna alerta SOS activa.</p>
          </div>
        ) : (
          urgencies.map(sos => (
            <div key={sos.id} className="bg-zinc-950 border border-red-900/50 p-6 flex flex-col md:flex-row gap-6 items-start justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="flex-1">
                <span className="text-red-500 text-[9px] uppercase tracking-widest font-bold animate-pulse mb-2 inline-block">
                  🚨 ACTIVA AHORA
                </span>
                <h3 className="text-xl font-serif text-white mb-1">{sos.title}</h3>
                <p className="text-white/70 text-sm mb-4 leading-relaxed">{sos.description}</p>
                <div className="flex gap-4 text-xs text-white/50 uppercase tracking-widest">
                  <span>{sos.dateStr}</span>
                  <span>•</span>
                  <span>{sos.price}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full md:w-64 shrink-0 relative z-10">
                <div className="bg-black border border-white/10 p-4 text-center">
                  <p className="text-3xl font-serif text-gold">0</p>
                  <p className="text-[9px] uppercase tracking-widest text-white/40">Candidatos Aplicados</p>
                </div>
                <button 
                  onClick={() => handleCancelSos(sos.id)}
                  className="w-full border border-white/20 text-white/50 hover:text-red-500 hover:border-red-500 py-3 text-[10px] uppercase tracking-widest font-bold transition-colors"
                >
                  Cancelar Alerta
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-white/10 p-8 max-w-lg w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif text-white">Lanzar Pánico SOS</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSos} className="flex flex-col gap-4">
              <div className="bg-red-900/20 border border-red-500/50 p-4 text-xs text-red-200 leading-relaxed mb-2">
                <strong>Atención:</strong> Esto enviará una notificación Push a todos los músicos disponibles en la zona. Úsalo solo para urgencias reales (cancelaciones a menos de 48h).
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Título corto</label>
                <input required type="text" placeholder="Ej: Se nos ha caído el grupo de rumba de hoy" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Cuándo</label>
                  <input required type="text" placeholder="Ej: Hoy 23:00h" value={formData.dateStr} onChange={e => setFormData({...formData, dateStr: e.target.value})} className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Presupuesto Aprox.</label>
                  <input type="text" placeholder="Ej: 200€" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Detalles (Qué buscas)</label>
                <textarea required rows={3} placeholder="Explica brevemente qué perfil musical necesitas para cubrir el hueco..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none resize-none"></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="mt-4 bg-red-600 hover:bg-red-500 text-white font-bold py-4 text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Lanzando alerta...' : 'Disparar Alarma a Músicos'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
