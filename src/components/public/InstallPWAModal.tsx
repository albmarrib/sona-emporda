import { useState, useEffect } from 'react';
import { X, Share, PlusSquare, Smartphone, Download } from 'lucide-react';

export const InstallPWAModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [os, setOs] = useState<'ios' | 'android' | 'other'>('other');
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Comprobar si ya está instalada o estamos en modo standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(Boolean(standalone));

    if (standalone) return;

    // Detectar OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setOs('ios');
    } else if (/android/.test(userAgent)) {
      setOs('android');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleCustomOpen = () => {
      setShowModal(true);
    };
    window.addEventListener('open-pwa-modal', handleCustomOpen);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-modal', handleCustomOpen);
    };
  }, []);

  const handleClose = () => {
    setShowModal(false);
  };

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowModal(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowModal(false);
    }
  };

  if (!showModal || isStandalone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-950 border border-gold/40 rounded-t-2xl sm:rounded-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-500 shadow-2xl">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-gold/30 shadow-md">
              <img src="/pwa-icon.png" alt="Sona Empordà" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-white font-serif font-bold leading-tight">Sona Empordà</h3>
              <p className="text-gold text-xs font-mono">App Oficial</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <h4 className="text-xl text-white mb-2 text-center font-serif">Instala la App en tu móvil</h4>
          <p className="text-gray-300 text-xs sm:text-sm mb-6 text-center leading-relaxed">
            Accede a toda la programación musical del Empordà con 1 solo toque, sin ocupar memoria y sin depender de descargas.
          </p>

          {/* Botón directo si el navegador soporta instalación nativa (Chrome / Android / Edge) */}
          {deferredPrompt && (
            <button
              onClick={handleNativeInstall}
              className="w-full mb-6 bg-gold hover:bg-white text-black font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer active:scale-95"
            >
              <Download size={18} />
              <span>Instalar Aplicación Ahora</span>
            </button>
          )}

          <div className="bg-black/60 border border-white/10 rounded-xl p-4 sm:p-5 mb-6">
            {os === 'ios' ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3.5 text-gray-200">
                  <div className="w-7 h-7 rounded-full bg-gold/20 text-gold flex items-center justify-center flex-shrink-0 text-xs font-bold font-mono">
                    1
                  </div>
                  <p className="text-xs sm:text-sm pt-0.5 leading-snug">
                    Pulsa el botón de <strong>Compartir</strong> en la barra de Safari <Share size={16} className="inline mx-1 text-blue-400 align-text-bottom" />
                  </p>
                </div>
                <div className="flex items-start gap-3.5 text-gray-200">
                  <div className="w-7 h-7 rounded-full bg-gold/20 text-gold flex items-center justify-center flex-shrink-0 text-xs font-bold font-mono">
                    2
                  </div>
                  <p className="text-xs sm:text-sm pt-0.5 leading-snug">
                    Baja un poco y selecciona <strong>Añadir a la pantalla de inicio</strong> <PlusSquare size={16} className="inline mx-1 text-gray-300 align-text-bottom" />
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3.5 text-gray-200">
                  <div className="w-7 h-7 rounded-full bg-gold/20 text-gold flex items-center justify-center flex-shrink-0 text-xs font-bold font-mono">
                    1
                  </div>
                  <p className="text-xs sm:text-sm pt-0.5 leading-snug">
                    Toca el icono de opciones (<strong>tres puntos</strong> en la esquina del navegador)
                  </p>
                </div>
                <div className="flex items-start gap-3.5 text-gray-200">
                  <div className="w-7 h-7 rounded-full bg-gold/20 text-gold flex items-center justify-center flex-shrink-0 text-xs font-bold font-mono">
                    2
                  </div>
                  <p className="text-xs sm:text-sm pt-0.5 leading-snug">
                    Selecciona <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong> <Smartphone size={16} className="inline mx-1 text-gold align-text-bottom" />
                  </p>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handleClose}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-lg transition-colors text-xs uppercase tracking-wider cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
