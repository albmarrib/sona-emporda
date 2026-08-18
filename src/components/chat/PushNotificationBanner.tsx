import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const PushNotificationBanner: React.FC = () => {
  const { requestPushPermission } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if permission is default (neither granted nor denied)
    if ('Notification' in window && Notification.permission === 'default') {
      setShow(true);
    }
  }, []);

  const handleAccept = async () => {
    await requestPushPermission();
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="bg-zinc-900 border border-gold/30 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center gap-4 shadow-lg shadow-gold/5">
      <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center shrink-0">
        <Bell className="w-6 h-6 text-gold animate-pulse" />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <h3 className="text-white font-bold mb-1">No te pierdas ningún bolo</h3>
        <p className="text-white/70 text-sm">Activa las notificaciones para saber al instante cuando un local o músico te escribe.</p>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <button 
          onClick={handleDismiss}
          className="flex-1 sm:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Más tarde
        </button>
        <button 
          onClick={handleAccept}
          className="flex-1 sm:flex-none px-4 py-2 bg-gold hover:bg-yellow-500 text-black rounded-lg transition-colors text-sm font-bold shadow-md shadow-gold/20"
        >
          Activar
        </button>
      </div>
    </div>
  );
};
