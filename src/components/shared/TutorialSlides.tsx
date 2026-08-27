import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { X, ChevronLeft, ChevronRight, Calendar, User, Briefcase, LifeBuoy, Search, MessageSquare, FileText, CheckCircle, Users, Share2, XCircle, Home } from 'lucide-react';

interface Slide {
  title: string;
  content: string;
  icon: React.ReactNode;
}

const musicianSlides: Slide[] = [
  {
    title: 'Tu Disponibilidad',
    content: 'Tu panel principal es el Calendario. Por defecto apareces como "Libre". Haz clic en cualquier día para bloquearlo si no estás disponible. ¡Mantenerlo al día es clave para que los locales te inviten a sus eventos!',
    icon: <Calendar className="w-16 h-16 text-gold flex-shrink-0" />
  },
  {
    title: 'Invitaciones a Eventos',
    content: 'Si un local te invita, verás un punto parpadeante en tu calendario y recibirás un mensaje en el chat para negociar. Podrás rechazar o aceptar la oferta entrando a los detalles del evento.',
    icon: <MessageSquare className="w-16 h-16 text-gold flex-shrink-0" />
  },
  {
    title: 'Confirmaciones',
    content: 'Al aceptar, el evento se confirma, el día se marca en rojo (Ocupado) y se publica en la web. Si quieres hacer "doblete", puedes reabrir tu disponibilidad. También puedes cancelar a última hora por imprevistos.',
    icon: <CheckCircle className="w-16 h-16 text-gold flex-shrink-0" />
  },
  {
    title: 'Buscador de Oportunidades',
    content: 'En la sección "Oportunidades" verás eventos de locales que aún buscan artistas. Los puntos parpadeantes indican fechas con plazas abiertas. ¡Haz clic en el día para verlas!',
    icon: <Search className="w-16 h-16 text-gold flex-shrink-0" />
  },
  {
    title: 'Postular y Negociar',
    content: 'Si te interesa un evento, puedes postular directamente. Esto notificará al local y abrirá un chat privado para acordar las condiciones. Si llegáis a un acuerdo, se añadirá a tu agenda.',
    icon: <Briefcase className="w-16 h-16 text-gold flex-shrink-0" />
  },
  {
    title: 'Alertas y Tablón SOS',
    content: 'Atento a las alertas rojas. El Tablón SOS muestra urgencias de última hora: locales que necesitan cubrir cancelaciones o músicos que buscan sustitutos (batería, guitarra...). ¡Tú puedes salvar la noche!',
    icon: <LifeBuoy className="w-16 h-16 text-gold flex-shrink-0" />
  },
  {
    title: 'Buscar Compañeros',
    content: 'Puedes usar el tablón para buscar un músico extra para tu bolo. Buscarás por nombre o disponibilidad y hablaréis por chat. El anuncio se hará público para todos para asegurarte de que encuentras a alguien.',
    icon: <Users className="w-16 h-16 text-gold flex-shrink-0" />
  },
  {
    title: 'Tu EPK y Chat Directo',
    content: 'En tu perfil EPK puedes actualizar fotos y enlaces cuando lo necesites. Además, el botón de chat flotante te permite retomar conversaciones rápidamente con locales o músicos.',
    icon: <User className="w-16 h-16 text-gold flex-shrink-0" />
  },
  {
    title: 'Trabajo en Equipo',
    content: 'Usa el botón "Compartir con la Banda" del calendario para enviar tu agenda por WhatsApp a tu grupo. Ellos verán tus conciertos y, si usan la app, ¡podrán bloquear esos días en sus propias agendas!',
    icon: <Share2 className="w-16 h-16 text-gold flex-shrink-0" />
  }
];

const venueSlides: Slide[] = [
  {
    title: 'Tu Centro de Control',
    content: 'El calendario es tu panel principal. Desde aquí, si haces clic en una fecha, podrás programar un nuevo evento y verás al instante los músicos disponibles en ese momento.',
    icon: <Calendar className="w-16 h-16 text-gold flex-shrink-0" />
  },
  {
    title: 'Eventos en Programación',
    content: 'Al crear un evento, la fecha se pondrá en verde. Automáticamente, este evento aparecerá en el tablón de oportunidades de todos los músicos, donde podrán postular si les interesa.',
    icon: <Calendar className="w-16 h-16 text-gold flex-shrink-0" />
  },
  {
    title: 'Buscar y Filtrar',
    content: 'También puedes buscar músicos desde el calendario (solo aparecerán los que tienen disponibilidad). Al hacer clic en su ficha podrás ver sus datos y contactar con ellos.',
    icon: <Users className="w-16 h-16 text-gold flex-shrink-0" />
  },
  {
    title: 'Invitar y Negociar',
    content: 'Al invitar a un músico, se generará un aviso en su calendario y se abrirá un chat privado para negociar las condiciones. La fecha en tu calendario se pondrá en amarillo (Esperando).',
    icon: <MessageSquare className="w-16 h-16 text-gold flex-shrink-0" />
  },
  {
    title: 'Confirmación Final',
    content: 'Si el músico rechaza, el día se pondrá rojo. Si confirma su interés, se pondrá azul. Haz clic en la fecha azul para confirmar el evento directamente y ¡publicarlo en la web pública!',
    icon: <CheckCircle className="w-16 h-16 text-gold flex-shrink-0" />
  },
  {
    title: 'Cancelaciones Inesperadas',
    content: 'Si un músico con evento confirmado cancela a última hora, tendrás un aviso inmediato. Podrás anular el evento por completo o mantener la fecha para seguir buscando otro grupo de inmediato.',
    icon: <XCircle className="w-16 h-16 text-gold flex-shrink-0" />
  },
  {
    title: 'Dashboard de Eventos',
    content: 'En tu sección Dashboard tendrás siempre la lista completa de todos tus eventos programados. Desde allí podrás revisarlos al detalle, editarlos o borrarlos si fuera necesario.',
    icon: <Home className="w-16 h-16 text-gold flex-shrink-0" />
  },
  {
    title: 'Directorio de Músicos',
    content: 'La sección "Buscador" te da acceso a toda la base de datos de músicos registrados. Explora sus perfiles sin necesidad de asociarlos a una fecha y ábreles un chat privado para contactarles.',
    icon: <Search className="w-16 h-16 text-gold flex-shrink-0" />
  },
  {
    title: 'Tablón de Urgencias SOS',
    content: '¿Te falla un grupo en el último minuto? ¡Que no cunda el pánico! Lanza un SOS urgente para que aparezca una alarma en los móviles de todos los músicos disponibles y encuentra sustituto rápido.',
    icon: <LifeBuoy className="w-16 h-16 text-gold flex-shrink-0" />
  },
  {
    title: '¡Corre la Voz!',
    content: 'En el menú tienes el botón de Compartir. Envíalo por WhatsApp a promotores y locales amigos; ¡cuantos más lo usemos, mejor funcionará para todos! Y recuerda que siempre puedes volver a ver este tutorial.',
    icon: <Share2 className="w-16 h-16 text-gold flex-shrink-0" />
  }
];

export const TutorialSlides = ({ onClose }: { onClose: () => void }) => {
  const { currentUser, userRole } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const slides = userRole === 'venue' ? venueSlides : musicianSlides;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleFinish = async () => {
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          tutorialSeen: true
        });
      } catch (error) {
        console.error("Error updating tutorial seen:", error);
      }
    }
    onClose();
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-950 border border-gold/20 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(197,160,89,0.1)] relative max-h-[95dvh] flex flex-col">
        
        {/* Botón cerrar */}
        <button 
          onClick={handleFinish}
          className="absolute top-4 right-4 text-white/50 hover:text-white p-2 rounded-full z-10 bg-black/50"
        >
          <X className="w-5 h-5" />
        </button>

        <div 
          className="p-6 md:p-12 text-center flex flex-col items-center flex-1 justify-center relative overflow-y-auto min-h-[300px] md:min-h-[400px]"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEndEvent}
        >
          
          {/* Animación básica con transiciones de React */}
          <div 
            key={currentSlide} 
            className="animate-in fade-in slide-in-from-right-8 duration-500 flex flex-col items-center"
          >
            <div className="mb-6 md:mb-8 p-4 md:p-6 rounded-full bg-gradient-to-b from-gold/20 to-transparent border border-gold/10">
              {slides[currentSlide].icon}
            </div>
            
            <h2 className="text-xl md:text-2xl font-serif text-white mb-3 md:mb-4 px-2">
              {slides[currentSlide].title}
            </h2>
            
            <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-md px-4 whitespace-pre-line text-left">
              {slides[currentSlide].content}
            </p>
          </div>
        </div>

        {/* Controles y progreso */}
        <div className="p-6 bg-black border-t border-white/5 flex items-center justify-between">
          
          <button 
            onClick={handlePrev}
            className={`p-2 rounded-full transition-colors ${currentSlide === 0 ? 'text-transparent cursor-default' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Indicadores */}
          <div className="flex gap-2">
            {slides.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? 'w-6 bg-gold' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          <button 
            onClick={handleNext}
            className="p-2 rounded-full text-gold hover:text-yellow-400 hover:bg-gold/10 transition-colors"
          >
            {currentSlide === slides.length - 1 ? (
              <span className="text-xs uppercase tracking-widest px-2 font-bold">Empezar</span>
            ) : (
              <ChevronRight className="w-6 h-6" />
            )}
          </button>

        </div>

      </div>
    </div>
  );
};
