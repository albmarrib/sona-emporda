import { useState, useEffect } from 'react';
import { db } from '../../firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { FiSave, FiMapPin, FiPhone, FiInfo } from 'react-icons/fi';

export const VenueProfile = () => {
  const { currentUser, userData } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [customInviteMessage, setCustomInviteMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setEmail(userData.email || currentUser?.email || '');
      setAddress(userData.address || '');
      setContactPhone(userData.contactPhone || '');
      setContactWhatsapp(userData.contactWhatsapp || '');
      setWebsiteUrl(userData.websiteUrl || '');
      setInstagramUrl(userData.instagramUrl || '');
      setCustomInviteMessage(userData.customInviteMessage || '');
    }
  }, [userData, currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name,
        email,
        address,
        contactPhone,
        contactWhatsapp,
        websiteUrl,
        instagramUrl,
        customInviteMessage
      });
      alert('Perfil actualizado con éxito. ¡Esta es la dirección que aparecerá en tus eventos y alertas SOS!');
    } catch (e) {
      console.error(e);
      alert('Error guardando perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto h-[calc(100vh-8rem)]">
      <div>
        <h1 className="text-3xl font-serif text-white mb-2">Mi Local</h1>
        <p className="text-white/50 text-xs uppercase tracking-widest">
          Gestiona los datos públicos de tu establecimiento.
        </p>
      </div>

      {!userData?.address && (
        <div className="bg-red-900/30 border border-red-500/50 p-4 flex gap-4 items-start text-red-200 text-sm">
          <FiInfo className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
          <p>
            <strong>Es obligatorio configurar la dirección de tu local</strong> para poder publicar eventos o crear alertas SOS. Los músicos y el público necesitan saber dónde estás.
          </p>
        </div>
      )}

      <div className="bg-black border border-white/10 p-6 md:p-8 flex flex-col gap-6 shadow-2xl">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-widest text-white/50">
            Nombre del Establecimiento
          </label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Sala Soho"
            className="bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-widest text-white/50">
            Email Público
          </label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ej: contacto@salasoho.com"
            className="bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-widest text-white/50 flex items-center gap-2">
            <FiMapPin /> Dirección Física Completa
          </label>
          <input 
            type="text" 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ej: Carrer Mayor 12, Palafrugell"
            className="bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-gold transition-colors"
          />
          <p className="text-[10px] text-white/30 italic">Esta dirección se usará automáticamente en el buscador de "Lugares" para la web pública.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-widest text-white/50 flex items-center gap-2">
            <FiPhone /> Teléfono Fijo o Contacto
          </label>
          <input 
            type="text" 
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="Ej: +34 900 000 000"
            className="bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-widest text-white/50 flex items-center gap-2">
            WhatsApp Business / Móvil (Opcional)
          </label>
          <input 
            type="text" 
            value={contactWhatsapp}
            onChange={(e) => setContactWhatsapp(e.target.value)}
            placeholder="Ej: +34 600 000 000"
            className="bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-widest text-white/50">
            Página Web (Opcional)
          </label>
          <input 
            type="url" 
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://tulocal.com"
            className="bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-widest text-white/50">
            Instagram (Opcional)
          </label>
          <input 
            type="url" 
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://instagram.com/tu_local"
            className="bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-widest text-white/50">
            Plantilla de Invitación (Chat)
          </label>
          <textarea 
            rows={3}
            value={customInviteMessage}
            onChange={(e) => setCustomInviteMessage(e.target.value)}
            placeholder="Ej: Hola, nos gustaría que actuaras en nuestro local..."
            className="bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-gold transition-colors resize-none"
          />
          <p className="text-[10px] text-white/30 italic">Este mensaje se usará como plantilla al invitar a un músico a un evento.</p>
        </div>

        <div className="pt-6 border-t border-white/10 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={loading || !address.trim()}
            className="flex items-center gap-2 bg-gold text-black px-6 py-3 font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
          >
            <FiSave /> {loading ? 'Guardando...' : 'Guardar Perfil'}
          </button>
        </div>
      </div>
    </div>
  );
};
