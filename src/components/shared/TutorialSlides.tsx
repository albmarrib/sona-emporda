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
    title: 'El Calendario es el Rey',
    content: 'Tu pantalla principal ahora es el Calendario. Mantenlo actualizado marcando los días que no estés disponible. ¡Los locales se fijan en tu disponibilidad real!',
    icon: <Calendar className="w-16 h-16 text-gold" />
  },
  {
    title: 'Navegación Fluida',
    content: 'Desliza tu dedo hacia la izquierda o derecha por la pantalla para moverte rápidamente entre el Calendario, tus Oportunidades, y el Tablón de Urgencias SOS.',
    icon: <Search className="w-16 h-16 text-gold" />
  },
  {
    title: 'Urgencias SOS',
    content: 'Presta atención a las alertas rojas en la pantalla. Si un local tiene una cancelación de última hora, ¡es tu oportunidad para salvar la noche!',
    icon: <LifeBuoy className="w-16 h-16 text-gold" />
  },
  {
    title: 'Tu EPK Público',
    content: 'Actualiza tus vídeos, Spotify y fotos desde tu Perfil. Siempre que lo necesites, puedes volver a ver este tutorial desde el icono de información en el menú.',
    icon: <User className="w-16 h-16 text-gold" />
  }
];

const venueSlides: Slide[] = [
  {
    title: 'Tu Programación',
    content: 'Entras directamente al Calendario de la sala. Desde aquí puedes ver de un vistazo qué días tienes cubiertos y cuáles están buscando banda.',
    icon: <Calendar className="w-16 h-16 text-gold" />
  },
  {
    title: 'Movilidad Rápida',
    content: 'Desliza lateralmente la pantalla para navegar hacia tu Dashboard (para confirmar artistas), el Buscador de bandas, o lanzar una alerta SOS.',
    icon: <Search className="w-16 h-16 text-gold" />
  },
  {
    title: 'Alertas SOS',
    content: 'Si te falla una banda a última hora, la sección SOS envía una notificación instantánea (Push/WhatsApp) a todos los músicos disponibles de tu zona.',
    icon: <LifeBuoy className="w-16 h-16 text-gold" />
  },
  {
    title: 'Buscador y Configuración',
    content: 'Encuentra a la banda ideal en el Buscador y mantén los datos de tu local actualizados en Perfil. Puedes volver a ver este tutorial desde el menú cuando quieras.',
    icon: <Briefcase className="w-16 h-16 text-gold" />
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
