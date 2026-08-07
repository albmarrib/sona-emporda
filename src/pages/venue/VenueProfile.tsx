import { useState } from 'react';
import { FiSave, FiMapPin, FiPhone, FiGlobe, FiInstagram } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export const VenueProfile = () => {
  useAuth();
  
  const [formData, setFormData] = useState({
    name: 'Sala Soho',
    address: 'Carrer Major 12, Palamós, Girona',
    phone: '+34 600 000 000',
    whatsapp: '+34 600 000 000',
    website: 'https://salasoho.com',
    instagram: '@salasoho',
    acceptsReservations: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-serif text-white mb-2">Perfil del Local</h1>
        <p className="text-white/50 text-xs uppercase tracking-widest">
          Configura la identidad de tu sala para los músicos y promotores
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8 bg-zinc-950 border border-white/10 p-8 shadow-2xl">
        
        {/* Basic Info */}
        <div className="flex flex-col gap-4">
          <h2 className="text-gold text-[10px] uppercase tracking-widest font-bold border-b border-white/10 pb-2">Información Básica</h2>
          
          <div className="flex flex-col gap-2">
            <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Nombre del Local / Promotor</label>
            <input 
              required type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2"><FiMapPin /> Dirección Completa</label>
            <input 
              required type="text" 
              value={formData.address} 
              onChange={e => setFormData({...formData, address: e.target.value})} 
              className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" 
            />
          </div>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-4">
          <h2 className="text-gold text-[10px] uppercase tracking-widest font-bold border-b border-white/10 pb-2">Contacto Directo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2"><FiPhone /> Teléfono Fijo</label>
              <input 
                type="text" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">WhatsApp (Booking)</label>
              <input 
                required type="text" 
                value={formData.whatsapp} 
                onChange={e => setFormData({...formData, whatsapp: e.target.value})} 
                className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" 
              />
            </div>
          </div>
        </div>

        {/* Links & Rules */}
        <div className="flex flex-col gap-4">
          <h2 className="text-gold text-[10px] uppercase tracking-widest font-bold border-b border-white/10 pb-2">Redes y Normas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2"><FiGlobe /> Sitio Web</label>
              <input 
                type="url" 
                value={formData.website} 
                onChange={e => setFormData({...formData, website: e.target.value})} 
                className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2"><FiInstagram /> Instagram</label>
              <input 
                type="text" 
                value={formData.instagram} 
                onChange={e => setFormData({...formData, instagram: e.target.value})} 
                className="bg-white/5 border border-white/10 py-3 px-4 text-sm text-white focus:border-gold focus:outline-none" 
              />
            </div>
          </div>

          <label className="flex items-center gap-4 mt-2 cursor-pointer group">
            <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.acceptsReservations ? 'bg-gold' : 'bg-white/10'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-transform ${formData.acceptsReservations ? 'left-7' : 'left-1'}`}></div>
            </div>
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={formData.acceptsReservations} 
              onChange={e => setFormData({...formData, acceptsReservations: e.target.checked})} 
            />
            <span className="text-sm text-white/80 group-hover:text-white transition-colors">Aceptamos reserva de mesas para los conciertos</span>
          </label>
        </div>

        <button 
          type="submit" 
          disabled={isSaving}
          className="mt-6 bg-gold hover:bg-white text-black font-bold py-4 text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          {isSaving ? 'Guardando...' : <><FiSave /> Guardar Perfil</>}
        </button>

      </form>

    </div>
  );
};
