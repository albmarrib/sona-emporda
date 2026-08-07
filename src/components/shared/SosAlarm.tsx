import { useState, useEffect } from 'react';
import { FiBell, FiSmartphone, FiX } from 'react-icons/fi';

export const SosAlarm = () => {
  const [activeAlert, setActiveAlert] = useState<{title: string, message: string} | null>(null);

  useEffect(() => {
    const handleSosAlert = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { title, message } = customEvent.detail || { title: 'Urgencia', message: 'Se ha disparado un evento' };
      
      setActiveAlert({ title, message });

      // Simulate a sound alarm (using a generic beep using Web Audio API to avoid local asset issues)
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime + 0.1); // A4
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.2); // A5
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Low volume
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.4);
      } catch (err) {
        console.warn('AudioContext no soportado o bloqueado por el navegador');
      }

      // Auto-hide after 8 seconds
      setTimeout(() => {
        setActiveAlert(null);
      }, 8000);
    };

    window.addEventListener('sos-alert', handleSosAlert);
    
    return () => {
      window.removeEventListener('sos-alert', handleSosAlert);
    };
  }, []);

  if (!activeAlert) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] w-80 md:w-96 flex flex-col gap-2 animate-in slide-in-from-right duration-300">
      
      {/* Simulación Notificación Push */}
      <div className="bg-zinc-900 border border-white/20 rounded-xl p-4 shadow-2xl flex gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500 animate-pulse"></div>
        <div className="bg-red-500/20 p-2 rounded-full h-fit">
          <FiBell className="text-red-500 w-5 h-5 animate-bounce" />
        </div>
        <div className="flex-1">
          <h4 className="text-white font-bold text-sm">SONA Empordà (Simulación Push)</h4>
          <p className="text-white/70 text-xs mt-1">🚨 Alerta SOS: {activeAlert.title}</p>
        </div>
        <button onClick={() => setActiveAlert(null)} className="text-white/40 hover:text-white h-fit">
          <FiX className="w-4 h-4" />
        </button>
      </div>

      {/* Simulación WhatsApp (n8n + Evolution API) */}
      <div className="bg-green-950/90 border border-green-500/30 rounded-xl p-4 shadow-2xl flex gap-4 backdrop-blur-md">
        <div className="bg-green-500/20 p-2 rounded-full h-fit">
          <FiSmartphone className="text-green-500 w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-green-400 font-bold text-sm tracking-wide">Evolution API (Simulación n8n)</h4>
          <p className="text-green-100/70 text-xs mt-1 leading-relaxed">
            Mensaje de WhatsApp despachado a la cola de envío para músicos compatibles en la zona.
          </p>
        </div>
      </div>

    </div>
  );
};
