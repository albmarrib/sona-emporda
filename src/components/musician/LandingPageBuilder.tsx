import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/imageCompression';
import { Palette, Image as ImageIcon, FileText, LayoutGrid, ExternalLink, Save } from 'lucide-react';
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
    ctaTarget: 'booking'
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

const CTA_TARGET_OPTIONS = [
  { value: 'contact', label: 'Contacto' },
  { value: 'booking', label: 'Contratación' },
  { value: 'live', label: 'Próximos Directos' },
  { value: 'music', label: 'Música' },
  { value: 'about', label: 'Acerca Nuestro' },
];

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

  const handleCtaTargetChange = (newTarget: string) => {
    const match = CTA_TARGET_OPTIONS.find(opt => opt.value === newTarget);
    const prefilledText = match ? match.label : newTarget;
    setConfig(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        ctaTarget: newTarget,
        ctaText: prefilledText
      }
    }));
  };

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

  const TABS = [
    { id: 'design', label: 'Diseño', icon: Palette },
    { id: 'images', label: 'Imágenes', icon: ImageIcon },
    { id: 'texts', label: 'Textos', icon: FileText },
    { id: 'modules', label: 'Módulos', icon: LayoutGrid }
  ] as const;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
        {/* Barra de pestañas adaptable a móvil (Grid de 4 en móvil garantizando que siempre se vea Módulos) */}
        <div className="grid grid-cols-4 sm:flex border-b border-white/10 w-full sm:w-auto gap-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-xs md:text-sm uppercase tracking-wider transition-all border-b-2 font-medium ${
                  isActive 
                    ? 'border-gold text-gold font-bold bg-white/5 shadow-sm' 
                    : 'border-transparent text-white/50 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Botones de acción */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {config.isActive && config.subdomain && (
            <a
              href={`/${config.subdomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial border border-gold text-gold px-3 sm:px-4 py-2.5 uppercase tracking-wider text-xs font-bold hover:bg-gold hover:text-black transition-colors flex items-center justify-center gap-1.5 text-center shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Mi Web</span>
            </a>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-initial bg-gold text-black px-4 sm:px-6 py-2.5 uppercase tracking-wider text-xs font-bold hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 text-center shadow-sm cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
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
              <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Enlace de la página</label>
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-white/40">sonaemporda.com/</span>
                <input 
                  type="text" 
                  value={config.subdomain} 
                  onChange={(e) => setConfig({...config, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                  className="bg-black border border-white/20 px-3 py-2 text-sm w-full max-w-xs focus:border-gold focus:outline-none transition-colors"
                  placeholder="mi-banda"
                />
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

            <div className="pt-2 border-t border-white/10">
              <label className="block text-xs uppercase tracking-widest text-gold font-bold mb-2">
                Disposición de la Web (Layout)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setConfig({...config, design: {...config.design, layout: 'vertical'}})}
                  className={`p-3 border text-left rounded transition-all ${
                    (config.design.layout || 'vertical') === 'vertical'
                      ? 'border-gold bg-gold/10 text-white'
                      : 'border-white/15 bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Vertical Clásica</span>
                    {(config.design.layout || 'vertical') === 'vertical' && <span className="text-gold">●</span>}
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Scroll vertical continuo tradicional hacia abajo.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig({...config, design: {...config.design, layout: 'horizontal'}})}
                  className={`p-3 border text-left rounded transition-all ${
                    config.design.layout === 'horizontal'
                      ? 'border-gold bg-gold/10 text-white'
                      : 'border-white/15 bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Horizontal Editorial</span>
                    {config.design.layout === 'horizontal' && <span className="text-gold">●</span>}
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Columnas laterales continuas (Scroll izquierda - derecha en PC).
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'images' && (
          <div className="space-y-6">
            <p className="text-sm text-white/60 mb-4">Las imágenes se comprimirán automáticamente antes de subir.</p>
            
            {[
              { 
                key: 'heroBackgroundUrl' as const, 
                opacityKey: 'heroOverlayOpacity' as const, 
                label: 'Fondo de Cabecera (Hero)',
                defaultOpacity: 30
              },
              { 
                key: 'liveBackgroundUrl' as const, 
                opacityKey: 'liveOverlayOpacity' as const, 
                label: 'Fondo sección Directos',
                defaultOpacity: 50
              },
              { 
                key: 'musicBackgroundUrl' as const, 
                opacityKey: 'musicOverlayOpacity' as const, 
                label: 'Fondo sección Música',
                defaultOpacity: 65
              },
              { 
                key: 'contactBackgroundUrl' as const, 
                opacityKey: 'contactOverlayOpacity' as const, 
                label: 'Fondo sección Solicitud / Contacto',
                defaultOpacity: 50
              }
            ].map(item => {
              const currentImageUrl = config.images[item.key];
              const currentOpacity = config.images[item.opacityKey] ?? item.defaultOpacity;
              const isDark = config.design.theme === 'dark';

              return (
                <div key={item.key} className="border border-white/10 p-4 rounded-sm bg-black/40 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="block text-xs uppercase tracking-widest text-gold font-bold">{item.label}</label>
                    {currentImageUrl && (
                      <span className="text-[11px] text-white/50">
                        Difuminado: <strong className="text-white">{currentOpacity}%</strong> (Visibilidad imagen: <strong className="text-gold">{100 - currentOpacity}%</strong>)
                      </span>
                    )}
                  </div>

                  {currentImageUrl && (
                    <div className="space-y-3">
                      {/* Vista previa con el nivel de opacidad en vivo */}
                      <div 
                        className="h-36 w-full max-w-md bg-cover bg-center border border-white/20 relative overflow-hidden rounded-sm"
                        style={{ backgroundImage: `url(${currentImageUrl})` }} 
                      >
                        <div 
                          className="absolute inset-0 flex items-center justify-center transition-colors"
                          style={{ 
                            backgroundColor: isDark 
                              ? `rgba(0, 0, 0, ${currentOpacity / 100})` 
                              : `rgba(255, 255, 255, ${currentOpacity / 100})` 
                          }}
                        >
                          <span className={`text-xs uppercase tracking-widest px-3 py-1 bg-black/60 backdrop-blur-sm border border-white/20 rounded font-medium ${isDark ? 'text-white' : 'text-white'}`}>
                            Vista Previa ({100 - currentOpacity}% visible)
                          </span>
                        </div>
                      </div>

                      {/* Deslizador de Intensidad / Difuminación */}
                      <div className="max-w-md bg-white/5 p-3 border border-white/10 rounded-sm space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/70">Intensidad de la foto</span>
                          <span className="text-gold font-mono text-xs">{100 - currentOpacity}%</span>
                        </div>
                        <input 
                          type="range"
                          min="10"
                          max="95"
                          step="5"
                          value={currentOpacity}
                          onChange={(e) => {
                            const newOpacity = parseInt(e.target.value, 10);
                            setConfig({
                              ...config,
                              images: {
                                ...config.images,
                                [item.opacityKey]: newOpacity
                              }
                            });
                          }}
                          className="w-full accent-[#c5a059] cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] uppercase tracking-wider text-white/40">
                          <span>Muy nítida (10%)</span>
                          <span>Equilibrada (50%)</span>
                          <span>Muy oscura (95%)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, item.key)}
                    className="text-xs text-white/60 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:uppercase file:tracking-widest file:bg-white/10 file:text-white hover:file:bg-gold hover:file:text-black transition-colors cursor-pointer"
                  />
                </div>
              );
            })}
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
                <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Enlace Botón Acción</label>
                <select 
                  value={config.hero.ctaTarget} 
                  onChange={(e) => handleCtaTargetChange(e.target.value)}
                  className="bg-black border border-white/20 px-3 py-2 text-sm w-full focus:border-gold focus:outline-none transition-colors"
                >
                  {CTA_TARGET_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-white/40 mt-1">Sección de la web a la que llevará el botón.</p>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">Texto Botón Acción</label>
                <input 
                  type="text" 
                  value={config.hero.ctaText} 
                  onChange={(e) => setConfig({...config, hero: {...config.hero, ctaText: e.target.value}})}
                  placeholder="Ej: Contratación"
                  className="bg-black border border-white/20 px-3 py-2 text-sm w-full focus:border-gold focus:outline-none transition-colors"
                />
                <p className="text-[10px] text-white/40 mt-1">Se autocompleta con el enlace, pero puedes personalizarlo.</p>
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
