import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const PushNotificationBanner: React.FC = () => {
  const { requestPushPermission } = useAuth();
  const [show, setShow] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    // Si el navegador no soporta notificaciones, no hacemos nada
    if (!('Notification' in window)) return;

    // Comprobar si el usuario ya decidió en esta sesión ignorarlo
    const dismissedUntil = localStorage.getItem('push_prompt_dismissed_until');
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      return;
    }

    // Si aún no ha concedido ni denegado ('default'), mostrar el modal para que no se le pase
    if (Notification.permission === 'default') {
      // Pequeño retardo de 1 segundo para que la pantalla inicial cargue con fluidez
      const timer = setTimeout(() => {
        setShow(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = async () => {
    setIsActivating(true);
    try {
      await requestPushPermission();
    } finally {
      setIsActivating(false);
      setShow(false);
    }
  };

  const handleDismiss = () => {
    // Si decide posponerlo, no molestamos durante 24 horas
    const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('push_prompt_dismissed_until', tomorrow.toString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-zinc-950 border border-gold/40 rounded-2xl shadow-2xl max-w-md w-full p-6 text-white text-center relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow de fondo decorativo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-gold/15 blur-3xl pointer-events-none rounded-full" />

        {/* Botón cerrar sutil */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icono animado */}
        <div className="w-16 h-16 bg-gold/15 border border-gold/40 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-gold/20">
          <Bell className="w-8 h-8 text-gold animate-bounce" />
        </div>

        {/* Textos claros e informativos */}
        <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-gold block mb-1">
          Avisos en tu Teléfono
        </span>
        <h3 className="text-xl md:text-2xl font-serif text-white font-bold mb-3">
          ¿Quieres recibir avisos al instante?
        </h3>
        
        <p className="text-white/70 text-sm leading-relaxed mb-6 font-light">
          Para que tu móvil te avise con <strong className="text-white font-medium">globos y notificaciones</strong> cuando un local te proponga un bolo, te escriba un mensaje o tengas una contratación, incluso con la app cerrada:
        </p>

        {/* Beneficios clave */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 mb-6 text-left space-y-2 text-xs text-white/80">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Avisos de nuevos mensajes de locales</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Globo de mensajes en el icono del móvil</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
            <span>Sin spam, sólo avisos de tu actividad</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleAccept}
            disabled={isActivating}
            className="w-full py-3.5 px-6 bg-gold hover:bg-yellow-500 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-gold/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {isActivating ? 'Activando avisos...' : 'Activar Notificaciones Ahora'}
          </button>
          
          <button
            onClick={handleDismiss}
            disabled={isActivating}
            className="w-full py-2.5 text-xs text-white/40 hover:text-white/80 transition-colors uppercase tracking-wider font-medium"
          >
            Recordármelo más tarde
          </button>
        </div>
      </div>
    </div>
  );
};
