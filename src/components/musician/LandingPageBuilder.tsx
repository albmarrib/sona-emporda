import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/imageCompression';
import type { LandingConfig } from '../../types/landing';

const DEFAULT_CONFIG: LandingConfig = {
  isActive: true,
  subdomain: '',
  design: {
    theme: 'dark',
    typography: 'sans-serif'
  },
  images: {
    heroBackgroundUrl: '',
    liveBackgroundUrl: '',
    musicBackgroundUrl: '',
    contactBackgroundUrl: ''
  },
  hero: {
    title: '',
    subtitle: '',
    biography: '',
    ctaText: 'Contratación',
    ctaTarget: 'contact'
  },
  modules: {
    showLiveDates: true,
    showSpotify: true,
    spotifyEmbedUrl: '',
    showYoutube: true,
    youtubeVideoId: '',
    youtubeVideoIds: [],
    showInstagram: true,
    instagramUsername: '',
    showBookingWidget: true
  }
};

export const LandingPageBuilder = () => {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState<LandingConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'images' | 'texts' | 'modules'>('design');

  useEffect(() => {
    const fetchConfig = async () => {
      if (!currentUser) return;
      try {
        const docRef = doc(db, `public_landings/${currentUser.uid}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data() as LandingConfig);
        } else {
          // If no config, set default and user's email as subdomain base (just a suggestion)
          const username = currentUser.email?.split('@')[0] || '';
          setConfig(prev => ({
            ...prev,
            subdomain: username,
            hero: { ...prev.hero, title: username }
          }));
        }
      } catch (error) {
        console.error("Error loading config:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const docRef = doc(db, `public_landings/${currentUser.uid}`);
      await setDoc(docRef, config);
      alert('Configuración guardada correctamente.');
    } catch (error) {
      console.error("Error saving config:", error);
      alert('Error al guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof LandingConfig['images']) => {
    if (!e.target.files || !e.target.files[0] || !currentUser) return;
    const file = e.target.files[0];
    
    try {
      const compressedFile = await compressImage(file, 200);
      const storageRef = ref(storage, `users/${currentUser.uid}/landing_images/${field}_${Date.now()}.jpg`);
      
      const snapshot = await uploadBytes(storageRef, compressedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setConfig(prev => ({
        ...prev,
        images: {
          ...prev.images,
          [field]: downloadURL
        }
      }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Hubo un error subiendo la imagen.");
    }
  };

  if (loading) {
    return <div className="text-white/60">Cargando constructor...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
        <div className="flex space-x-2 border-b border-white/10 w-full sm:w-auto">
          {(['design', 'images', 'texts', 'modules'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm uppercase tracking-widest transition-colors border-b-2 ${
                activeTab === tab 
                  ? 'border-gold text-gold' 
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              {tab === 'design' ? 'Diseño' : tab === 'images' ? 'Imágenes' : tab === 'texts' ? 'Textos' : 'Módulos'}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gold text-black px-6 py-2 uppercase tracking-widest text-sm font-bold hover:bg-white transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === 'design' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Estado de la web</label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.isActive} 
                  onChange={(e) => setConfig({...config, isActive: e.target.checked})}
                  className="form-checkbox h-5 w-5 text-gold bg-black border-white/20 focus:ring-gold focus:ring-offset-black"
                />
                <span className="text-sm">Activar página pública</span>
              </label>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Subdominio</label>
              <div className="flex items-center">
                <input 
                  type="text" 
                  value={config.subdomain} 
                  onChange={(e) => setConfig({...config, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                  className="bg-black border border-white/20 px-3 py-2 text-sm w-full max-w-xs focus:border-gold focus:outline-none transition-colors"
                  placeholder="mi-banda"
                />
                <span className="ml-2 text-white/40">.sonaemporda.com</span>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Tema</label>
              <select 
                value={config.design.theme} 
                onChange={(e) => setConfig({...config, design: {...config.design, theme: e.target.value as 'dark' | 'light'}})}
                className="bg-black border border-white/20 px-3 py-2 text-sm w-full max-w-xs focus:border-gold focus:outline-none transition-colors"
              >
                <option value="dark">Oscuro (Dark)</option>
                <option value="light">Claro (Light)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Tipografía</label>
              <select 
                value={config.design.typography} 
                onChange={(e) => setConfig({...config, design: {...config.design, typography: e.target.value as any}})}
                className="bg-black border border-white/20 px-3 py-2 text-sm w-full max-w-xs focus:border-gold focus:outline-none transition-colors"
              >
                <option value="sans-serif">Moderna (Sans-serif)</option>
                <option value="serif">Clásica (Serif)</option>
                <option value="mono">Técnica (Monospace)</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'images' && (
          <div className="space-y-6">
            <p className="text-sm text-white/60 mb-4">Las imágenes se comprimirán automáticamente antes de subir.</p>
            
            {[
              { key: 'heroBackgroundUrl', label: 'Fondo de Cabecera (Hero)' },
              { key: 'liveBackgroundUrl', label: 'Fondo sección Directos' },
              { key: 'musicBackgroundUrl', label: 'Fondo sección Música' },
              { key: 'contactBackgroundUrl', label: 'Fondo sección Contacto' }
            ].map(item => (
              <div key={item.key} className="border border-white/10 p-4">
                <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">{item.label}</label>
                {config.images[item.key as keyof LandingConfig['images']] && (
                  <div className="mb-3 h-32 w-full max-w-md bg-white/5 bg-cover bg-center border border-white/10" 
                       style={{ backgroundImage: `url(${config.images[item.key as keyof LandingConfig['images']]})` }} 
                  />
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, item.key as keyof LandingConfig['images'])}
                  className="text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:uppercase file:tracking-widest file:bg-white/10 file:text-white hover:file:bg-white/20 transition-colors"
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'texts' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Título Principal (Hero)</label>
              <input 
                type="text" 
                value={config.hero.title} 
                onChange={(e) => setConfig({...config, hero: {...config.hero, title: e.target.value}})}
                className="bg-black border border-white/20 px-3 py-2 text-sm w-full focus:border-gold focus:outline-none transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Subtítulo (Hero)</label>
              <input 
                type="text" 
                value={config.hero.subtitle} 
                onChange={(e) => setConfig({...config, hero: {...config.hero, subtitle: e.target.value}})}
                className="bg-black border border-white/20 px-3 py-2 text-sm w-full focus:border-gold focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Biografía (Máx 300 caract.)</label>
              <textarea 
                value={config.hero.biography || ''} 
                maxLength={300}
                onChange={(e) => setConfig({...config, hero: {...config.hero, biography: e.target.value}})}
                className="bg-black border border-white/20 px-3 py-2 text-sm w-full h-24 resize-none focus:border-gold focus:outline-none transition-colors"
                placeholder="Breve historia o frase que defina al artista..."
              />
              <div className="text-right text-[10px] text-white/40 mt-1">
                {(config.hero.biography || '').length}/300
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Texto Botón Acción</label>
                <input 
                  type="text" 
                  value={config.hero.ctaText} 
                  onChange={(e) => setConfig({...config, hero: {...config.hero, ctaText: e.target.value}})}
                  className="bg-black border border-white/20 px-3 py-2 text-sm w-full focus:border-gold focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Enlace Botón Acción</label>
                <select 
                  value={config.hero.ctaTarget} 
                  onChange={(e) => setConfig({...config, hero: {...config.hero, ctaTarget: e.target.value}})}
                  className="bg-black border border-white/20 px-3 py-2 text-sm w-full focus:border-gold focus:outline-none transition-colors"
                >
                  <option value="contact">Contacto</option>
                  <option value="live">Próximos Directos</option>
                  <option value="music">Música</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fechas */}
              <div className="border border-white/10 p-4">
                <label className="flex items-center space-x-3 cursor-pointer mb-2">
                  <input 
                    type="checkbox" 
                    checked={config.modules.showLiveDates} 
                    onChange={(e) => setConfig({...config, modules: {...config.modules, showLiveDates: e.target.checked}})}
                    className="form-checkbox h-4 w-4 text-gold bg-black border-white/20 focus:ring-gold focus:ring-offset-black"
                  />
                  <span className="text-sm font-bold">Mostrar Fechas de Directo</span>
                </label>
                <p className="text-xs text-white/40 ml-7">Se alimentará de tus eventos públicos del calendario.</p>
              </div>

              {/* Booking */}
              <div className="border border-white/10 p-4">
                <label className="flex items-center space-x-3 cursor-pointer mb-2">
                  <input 
                    type="checkbox" 
                    checked={config.modules.showBookingWidget} 
                    onChange={(e) => setConfig({...config, modules: {...config.modules, showBookingWidget: e.target.checked}})}
                    className="form-checkbox h-4 w-4 text-gold bg-black border-white/20 focus:ring-gold focus:ring-offset-black"
                  />
                  <span className="text-sm font-bold">Widget de Contratación</span>
                </label>
                <p className="text-xs text-white/40 ml-7">Permitir peticiones de contratación a través de la web.</p>
              </div>

              {/* Spotify */}
              <div className="border border-white/10 p-4">
                <label className="flex items-center space-x-3 cursor-pointer mb-3">
                  <input 
                    type="checkbox" 
                    checked={config.modules.showSpotify} 
                    onChange={(e) => setConfig({...config, modules: {...config.modules, showSpotify: e.target.checked}})}
                    className="form-checkbox h-4 w-4 text-gold bg-black border-white/20 focus:ring-gold focus:ring-offset-black"
                  />
                  <span className="text-sm font-bold">Mostrar Spotify</span>
                </label>
                {config.modules.showSpotify && (
                  <div className="ml-7 mt-2">
                    <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">Enlace embed o URL de artista</label>
                    <input 
                      type="text" 
                      value={config.modules.spotifyEmbedUrl} 
                      onChange={(e) => setConfig({...config, modules: {...config.modules, spotifyEmbedUrl: e.target.value}})}
                      className="bg-black border border-white/20 px-3 py-1.5 text-xs w-full focus:border-gold focus:outline-none transition-colors"
                      placeholder="https://open.spotify.com/artist/..."
                    />
                  </div>
                )}
              </div>

              {/* YouTube */}
              <div className="border border-white/10 p-4">
                <label className="flex items-center space-x-3 cursor-pointer mb-3">
                  <input 
                    type="checkbox" 
                    checked={config.modules.showYoutube} 
                    onChange={(e) => setConfig({...config, modules: {...config.modules, showYoutube: e.target.checked}})}
                    className="form-checkbox h-4 w-4 text-gold bg-black border-white/20 focus:ring-gold focus:ring-offset-black"
                  />
                  <span className="text-sm font-bold">Mostrar YouTube</span>
                </label>
                {config.modules.showYoutube && (
                  <div className="ml-7 mt-2">
                    <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">IDs o Enlaces de Videos (uno por línea, máx 5)</label>
                    <textarea 
                      value={(config.modules.youtubeVideoIds?.length ? config.modules.youtubeVideoIds : (config.modules.youtubeVideoId ? [config.modules.youtubeVideoId] : [])).join('\n')} 
                      onChange={(e) => {
                        const lines = e.target.value.split('\n').slice(0, 5);
                        setConfig({...config, modules: {...config.modules, youtubeVideoIds: lines}});
                      }}
                      className="bg-black border border-white/20 px-3 py-1.5 text-xs w-full focus:border-gold focus:outline-none transition-colors h-24 resize-none"
                      placeholder="https://youtube.com/watch?v=...\nO simplemente el ID..."
                    />
                  </div>
                )}
              </div>

              {/* Instagram */}
              <div className="border border-white/10 p-4 md:col-span-2">
                <label className="flex items-center space-x-3 cursor-pointer mb-3">
                  <input 
                    type="checkbox" 
                    checked={config.modules.showInstagram} 
                    onChange={(e) => setConfig({...config, modules: {...config.modules, showInstagram: e.target.checked}})}
                    className="form-checkbox h-4 w-4 text-gold bg-black border-white/20 focus:ring-gold focus:ring-offset-black"
                  />
                  <span className="text-sm font-bold">Mostrar Feed de Instagram</span>
                </label>
                {config.modules.showInstagram && (
                  <div className="ml-7 mt-2 w-full md:w-1/2">
                    <label className="block text-[10px] uppercase tracking-widest text-white/60 mb-1">Usuario (sin @)</label>
                    <input 
                      type="text" 
                      value={config.modules.instagramUsername} 
                      onChange={(e) => setConfig({...config, modules: {...config.modules, instagramUsername: e.target.value}})}
                      className="bg-black border border-white/20 px-3 py-1.5 text-xs w-full focus:border-gold focus:outline-none transition-colors"
                      placeholder="usuario"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
