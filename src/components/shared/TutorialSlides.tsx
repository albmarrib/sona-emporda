import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { X, ChevronLeft, ChevronRight, Calendar, User, Briefcase, LifeBuoy, Search, MessageSquare, FileText } from 'lucide-react';

interface Slide {
  title: string;
  content: string;
  icon: React.ReactNode;
}

const musicianSlides: Slide[] = [
  {
    title: 'Bienvenido a Sona Empordà',
    content: 'En tu Dashboard verás todos tus eventos programados y también aparecerá siempre la última solicitud urgente de ayuda (SOS) de locales u otros músicos.',
    icon: <User className="w-16 h-16 text-gold" />
  },
  {
    title: 'Tu Calendario (Disponibilidad)',
    content: 'Controla tu agenda fácilmente marcando los días que estás libre. Si no lo rellenas, aparecerás como "posible disponible". Si lo pones verde, ¡apareces como buscando bolo activamente!',
    icon: <Calendar className="w-16 h-16 text-gold" />
  },
  {
    title: 'Tu Calendario (Eventos)',
    content: 'Aquí verás los días con evento (que aparecerán automáticamente como NO disponibles). También puedes hacer clic en cualquier día para bloquearlo manualmente (rojo) cuando no puedas tocar.',
    icon: <Calendar className="w-16 h-16 text-gold" />
  },
  {
    title: 'Invitaciones Directas',
    content: 'Aquí recibirás en detalle cualquier invitación directa de un local. Podrás contactar con ellos y, si se confirma un bolo, aparecerá automáticamente en tu calendario.',
    icon: <MessageSquare className="w-16 h-16 text-gold" />
  },
  {
    title: 'Oportunidades',
    content: 'Descubre toda la oferta de conciertos de locales que aún no tienen músico. Postúlate para que les llegue un aviso directo y empecéis a negociar el evento.',
    icon: <Briefcase className="w-16 h-16 text-gold" />
  },
  {
    title: 'Tablón S.O.S',
    content: 'Lanza un SOS a otros músicos si te falla alguien a última hora (el batería, guitarra...), o revisa el tablón para ayudar a otros músicos y locales en apuros.',
    icon: <LifeBuoy className="w-16 h-16 text-gold" />
  },
  {
    title: 'Tu EPK Público',
    content: 'Actualiza tus vídeos, Spotify y fotos cuando quieras, ¡es lo que verán locales y público! Por cierto, siempre que lo necesites, puedes volver a ver este tutorial desde el menú.',
    icon: <FileText className="w-16 h-16 text-gold" />
  }
];

const venueSlides: Slide[] = [
  {
    title: 'Bienvenido a Sona Empordà',
    content: 'Tu centro de mando. Aquí podrás gestionar tu calendario, organizar conciertos, buscar y negociar con músicos, o solicitar ayuda rápida en caso de cancelaciones de última hora.',
    icon: <Search className="w-16 h-16 text-gold" />
  },
  {
    title: 'Tu Dashboard',
    content: 'Es la pantalla principal. Verás tus próximos eventos programados de un vistazo, y tendrás acceso directo para programar nuevos eventos o buscar músicos.',
    icon: <Briefcase className="w-16 h-16 text-gold" />
  },
  {
    title: 'El Calendario (Organización)',
    content: 'Tu herramienta más potente. Haz clic en un día para programar. Al hacerlo, verás primero a los músicos que buscan bolo activamente ese día, y luego al resto de músicos disponibles.',
    icon: <Calendar className="w-16 h-16 text-gold" />
  },
  {
    title: 'El Calendario (Negociación)',
    content: 'Contacta a un músico; el evento quedará en amarillo esperando su respuesta. Si creas un evento abierto, los músicos podrán postularse (lo verás con un punto rojo parpadeante).',
    icon: <MessageSquare className="w-16 h-16 text-gold" />
  },
  {
    title: 'El Calendario (Publicación)',
    content: 'Cuando confirmes oficialmente el evento con el músico en tu panel, ¡se publicará automáticamente en la web para todo el público! También puedes buscar músicos por nombre directamente aquí.',
    icon: <Calendar className="w-16 h-16 text-gold" />
  },
  {
    title: 'Buscador de Artistas',
    content: 'Explora toda nuestra base de datos. Revisa sus vídeos, necesidades técnicas (Rider) y fotos. Filtra por estilo musical o búscalos por nombre para contactarles directamente.',
    icon: <User className="w-16 h-16 text-gold" />
  },
  {
    title: 'Urgencias S.O.S',
    content: '¿Cancelación a última hora? Lanza un aviso S.O.S que llegará a todos los músicos registrados para que alguien te cubra. IMPORTANTE: ¡Recuerda desactivarlo cuando lo soluciones!',
    icon: <LifeBuoy className="w-16 h-16 text-gold" />
  },
  {
    title: 'Configuración y Ayuda',
    content: 'Puedes modificar los datos públicos de tu local pulsando el icono de la rueda dentada. Y si alguna vez necesitas repasar esto, ¡puedes volver a ver este tutorial desde el menú!',
    icon: <FileText className="w-16 h-16 text-gold" />
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
            
            <p className="text-white/60 text-sm leading-relaxed max-w-sm px-2">
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
