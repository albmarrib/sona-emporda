import React from 'react';
import { Share2 } from 'lucide-react';

interface InviteColleaguesProps {
  userType: 'musician' | 'venue';
}

export const InviteColleagues: React.FC<InviteColleaguesProps> = ({ userType }) => {
  const getAppUrl = () => {
    return 'https://www.sonaemporda.com';
  };

  const handleInvite = () => {
    const appUrl = getAppUrl();
    let message = "";

    if (userType === 'musician') {
      message = `¡Ey! Me he registrado en Sona Empordà, la plataforma para conseguir bolos y ver qué locales buscan música en la zona.\n\nEchadle un ojo, está genial: ${appUrl}\n\nRegistrarse es gratis y al entrar hay un tutorial rápido que lo explica todo.`;
    } else {
      message = `Hola! He empezado a usar Sona Empordà para gestionar los conciertos de nuestro local y encontrar bandas.\n\nSi conocéis músicos o tenéis un grupo, entrad aquí: ${appUrl}`;
    }

    // Usamos wa.me que funciona en móvil (abre la app) y en PC (abre WhatsApp Web)
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleInvite}
      className="flex items-center justify-center bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border border-[#25D366]/30 transition-all w-8 h-8 md:w-9 md:h-9 rounded-full group shadow-md shadow-[#25D366]/5 flex-shrink-0 cursor-pointer"
      title="Compartir la app por WhatsApp"
    >
      <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:scale-110 transition-transform" />
    </button>
  );
};
