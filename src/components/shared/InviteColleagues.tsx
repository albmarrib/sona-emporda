import React from 'react';
import { Share2 } from 'lucide-react';

interface InviteColleaguesProps {
  userType: 'musician' | 'venue';
}

export const InviteColleagues: React.FC<InviteColleaguesProps> = ({ userType }) => {
  const appUrl = "https://sona-emporda.com"; // Placeholder URL, to be updated later

  const handleInvite = () => {
    let message = "";

    if (userType === 'musician') {
      message = `Ey, me acabo de registrar en Sona Empordà, una nueva app para conseguir bolos y ver qué locales buscan música por la zona. Echadle un ojo que pinta brutal: ${appUrl} Registraos que es gratis y nada más entrar sale un tutorial rápido que lo explica todo.`;
    } else {
      message = `He empezado a usar Sona Empordà para gestionar la agenda musical del local y encontrar artistas. Si conocéis músicos o tenéis bandas, pasadles esto que nos irá genial a todos: ${appUrl}`;
    }

    // Usamos wa.me que funciona en móvil (abre la app) y en PC (abre WhatsApp Web)
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleInvite}
      className="flex items-center justify-center bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border border-[#25D366]/30 transition-all w-8 h-8 md:w-9 md:h-9 rounded-full group shadow-md shadow-[#25D366]/5 flex-shrink-0"
      title="Invitar a colegas por WhatsApp"
    >
      <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:scale-110 transition-transform" />
    </button>
  );
};
