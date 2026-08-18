import { useState, useEffect } from 'react';
import { X, Share, PlusSquare, Smartphone } from 'lucide-react';

export const InstallPWAModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [os, setOs] = useState<'ios' | 'android' | 'other'>('other');
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Comprobar si ya está instalada o estamos en modo standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(standalone);

    // Si ya está instalada, no mostrar
    if (standalone) return;

    // Detectar OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setOs('ios');
    } else if (/android/.test(userAgent)) {
      setOs('android');
    }

    const handleCustomOpen = () => {
      setShowModal(true);
    };
    window.addEventListener('open-pwa-modal', handleCustomOpen);

    // Comprobar si ya se ha mostrado antes
    const hasSeenPrompt = localStorage.getItem('pwaPromptSeen');
    
    // Si es móvil y no lo ha visto, mostrar
    if (!hasSeenPrompt && (/iphone|ipad|ipod|android/.test(userAgent))) {
      // Pequeño retraso para que no sea tan agresivo al cargar
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 1500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('open-pwa-modal', handleCustomOpen);
      };
    }

    return () => {
      window.removeEventListener('open-pwa-modal', handleCustomOpen);
    };
  }, []);

  const handleClose = () => {
    setShowModal(false);
    localStorage.setItem('pwaPromptSeen', 'true');
  };

  if (!showModal || isStandalone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-gold/30 rounded-t-2xl sm:rounded-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-gold/20">
              <img src="/pwa-icon.png" alt="Sona Empordà" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-white font-serif font-bold leading-tight">Sona Empordà</h3>
              <p className="text-gold text-xs">Añadir a inicio</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <h4 className="text-xl text-white mb-2 text-center">Mejora tu experiencia</h4>
          <p className="text-gray-300 text-sm mb-6 text-center">
            Instala Sona Empordà en tu dispositivo para un acceso más rápido y fluido, como si fuera una app nativa.
          </p>

          <div className="bg-black/50 border border-white/5 rounded-xl p-5 mb-6">
            {os === 'ios' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-gray-200">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <p className="text-sm">Pulsa el botón de <strong>Compartir</strong> en la barra de Safari <Share size={18} className="inline mx-1 text-blue-400" /></p>
                </div>
                <div className="flex items-center gap-4 text-gray-200">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <p className="text-sm">Selecciona <strong>Añadir a la pantalla de inicio</strong> <PlusSquare size={18} className="inline mx-1 text-gray-300" /></p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-gray-200">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <p className="text-sm">Toca el icono de menú (tres puntos) del navegador</p>
                </div>
                <div className="flex items-center gap-4 text-gray-200">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <p className="text-sm">Selecciona <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong> <Smartphone size={18} className="inline mx-1" /></p>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handleClose}
            className="w-full bg-gold text-black font-bold py-3 rounded-lg hover:bg-yellow-500 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
