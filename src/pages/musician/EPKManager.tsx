import { useState, useEffect } from 'react';
import { FiUploadCloud, FiSave, FiMusic, FiLink2, FiFileText, FiImage, FiPhone } from 'react-icons/fi';
import { useMusicianProfile } from '../../hooks/useMusicianProfile';
import type { MusicianProfile } from '../../data/mockMusicianData';

export const EPKManager = () => {
  const { profile, loading, updateProfile } = useMusicianProfile();
  const [saving, setSaving] = useState(false);
  
  // Local form state
  const [formData, setFormData] = useState<Partial<MusicianProfile>>({});

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateProfile(formData);
    setSaving(false);
  };

  const handleChange = (field: keyof MusicianProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="text-gold animate-pulse text-xs uppercase tracking-widest font-bold">Cargando perfil...</div>;
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-serif text-white mb-2">Mi EPK</h1>
        <p className="text-white/50 text-xs uppercase tracking-widest">
          Gestiona tu Electronic Press Kit. Esta es tu carta de presentación para los locales.
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-12">
        
        {/* Basic Info */}
        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-serif text-gold flex items-center gap-3">
            <FiMusic className="w-5 h-5" />
            Información Básica
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Nombre Artístico</label>
              <input 
                type="text" 
                value={formData.stageName || ''} 
                onChange={(e) => handleChange('stageName', e.target.value)}
                className="bg-white/5 border border-white/10 py-3 px-4 text-sm font-sans text-white focus:outline-none focus:border-gold transition-colors" 
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Género Principal</label>
              <select 
                value={formData.mainGenre || 'acoustic'}
                onChange={(e) => handleChange('mainGenre', e.target.value)}
                className="bg-white/5 border border-white/10 py-3 px-4 text-sm font-sans text-white focus:outline-none focus:border-gold transition-colors appearance-none cursor-pointer"
              >
                <option value="Indie" className="bg-zinc-950 text-white">Indie / Alternativo</option>
                <option value="Rock" className="bg-zinc-950 text-white">Rock</option>
                <option value="Pop" className="bg-zinc-950 text-white">Pop</option>
                <option value="Electrónica" className="bg-zinc-950 text-white">Electrónica / DJ</option>
                <option value="Acústico" className="bg-zinc-950 text-white">Acústico / Cantautor</option>
                <option value="Jazz" className="bg-zinc-950 text-white">Jazz / Soul</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Tipo de Formación</label>
              <select 
                value={formData.formationType || 'solo'}
                onChange={(e) => handleChange('formationType', e.target.value)}
                className="bg-white/5 border border-white/10 py-3 px-4 text-sm font-sans text-white focus:outline-none focus:border-gold transition-colors appearance-none cursor-pointer"
              >
                <option value="solo" className="bg-zinc-950 text-white">Solista</option>
                <option value="duo" className="bg-zinc-950 text-white">Dúo</option>
                <option value="band" className="bg-zinc-950 text-white">Banda / Grupo</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Número de Miembros</label>
              <input 
                type="number" 
                min="1"
                value={formData.membersCount || 1} 
                onChange={(e) => handleChange('membersCount', parseInt(e.target.value))}
                className="bg-white/5 border border-white/10 py-3 px-4 text-sm font-sans text-white focus:outline-none focus:border-gold transition-colors" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Nombres de los Miembros</label>
            <input 
              type="text" 
              placeholder="Ej: Laura (Voz), Marc (Guitarra)..."
              value={formData.membersNames || ''} 
              onChange={(e) => handleChange('membersNames', e.target.value)}
              className="bg-white/5 border border-white/10 py-3 px-4 text-sm font-sans text-white focus:outline-none focus:border-gold transition-colors" 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Biografía Corta</label>
            <textarea 
              rows={4} 
              value={formData.shortBio || ''}
              onChange={(e) => handleChange('shortBio', e.target.value)}
              className="bg-white/5 border border-white/10 py-3 px-4 text-sm font-sans text-white focus:outline-none focus:border-gold transition-colors resize-none"
            ></textarea>
          </div>
        </section>

        {/* Contacto (Agentes IA) */}
        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-serif text-gold flex items-center gap-3">
            <FiPhone className="w-5 h-5" />
            Contacto de Contratación
          </h2>
          <p className="text-white/40 text-xs">
            Esta información se usará para notificarte (y en el futuro mediante Agentes IA) cuando un local quiera contratarte.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Teléfono Móvil</label>
              <input 
                type="tel" 
                placeholder="+34 600 000 000"
                value={formData.contactPhone || ''} 
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                className="bg-white/5 border border-white/10 py-3 px-4 text-sm font-sans text-white focus:outline-none focus:border-gold transition-colors" 
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">WhatsApp Business / Móvil</label>
              <input 
                type="tel" 
                placeholder="+34 600 000 000"
                value={formData.contactWhatsapp || ''} 
                onChange={(e) => handleChange('contactWhatsapp', e.target.value)}
                className="bg-white/5 border border-white/10 py-3 px-4 text-sm font-sans text-white focus:outline-none focus:border-gold transition-colors" 
              />
            </div>
          </div>
        </section>

        {/* Media & Links */}
        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-serif text-gold flex items-center gap-3">
            <FiLink2 className="w-5 h-5" />
            Enlaces y Multimedia
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Enlace a Spotify (Artist Page)</label>
              <input 
                type="url" 
                placeholder="https://open.spotify.com/artist/..." 
                value={formData.spotifyUrl || ''}
                onChange={(e) => handleChange('spotifyUrl', e.target.value)}
                className="bg-white/5 border border-white/10 py-3 px-4 text-sm font-sans text-white focus:outline-none focus:border-gold transition-colors" 
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Video Destacado (YouTube)</label>
              <input 
                type="url" 
                placeholder="https://youtube.com/watch?v=..." 
                value={formData.youtubeUrl || ''}
                onChange={(e) => handleChange('youtubeUrl', e.target.value)}
                className="bg-white/5 border border-white/10 py-3 px-4 text-sm font-sans text-white focus:outline-none focus:border-gold transition-colors" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Fotografía Promocional</label>
            <div className="border-2 border-dashed border-white/20 p-8 flex flex-col items-center justify-center gap-4 hover:border-gold hover:bg-white/5 transition-all cursor-pointer">
              <FiImage className="w-8 h-8 text-white/40" />
              <div className="text-center">
                <p className="text-sm text-white">Haz clic para subir una imagen</p>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">JPG o PNG. Máx 5MB.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Rider */}
        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-serif text-gold flex items-center gap-3">
            <FiFileText className="w-5 h-5" />
            Technical Rider
          </h2>
          
          <p className="text-white/60 text-sm">
            Especifica tus necesidades técnicas para que el local sepa qué equipo debe preparar o qué vas a llevar tú.
          </p>

          <div className="flex flex-col gap-2">
            <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Descripción Técnica</label>
            <textarea 
              rows={4} 
              value={formData.technicalRider || ''}
              onChange={(e) => handleChange('technicalRider', e.target.value)}
              placeholder="Ej: Llevamos nuestra propia mesa de mezclas. Necesitamos 2 tomas de corriente y 2 envíos a PA..."
              className="bg-white/5 border border-white/10 py-3 px-4 text-sm font-sans text-white focus:outline-none focus:border-gold transition-colors resize-none"
            ></textarea>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Opcional: Subir PDF del Rider</label>
            <button type="button" className="bg-black border border-white/20 text-white hover:border-gold hover:text-gold px-6 py-3 flex items-center justify-center gap-3 text-xs uppercase tracking-widest transition-colors w-full md:w-auto">
              <FiUploadCloud className="w-4 h-4" />
              Seleccionar Archivo PDF
            </button>
          </div>
        </section>

        {/* Submit */}
        <div className="border-t border-white/10 pt-8 flex justify-end">
          <button 
            type="submit"
            disabled={saving}
            className="bg-gold text-black font-bold px-8 py-4 text-xs uppercase tracking-widest hover:bg-white transition-colors flex items-center gap-2"
          >
            {saving ? 'Guardando...' : (
              <>
                <FiSave className="w-4 h-4" />
                Guardar EPK
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
