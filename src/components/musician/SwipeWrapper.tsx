import { type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * SwipeWrapper — Contenedor invisible de navegación por gesto.
 *
 * Envuelve el contenido de las 3 vistas principales del músico y permite
 * navegar entre ellas deslizando el dedo horizontalmente.
 * El scroll vertical del contenido interno queda libre gracias a `touchAction: 'pan-y'`.
 *
 * Orden de rutas (se puede ampliar):
 *   /musician/calendar  ←→  /musician/opportunities  ←→  /musician/dashboard
 */

const HUB_ROUTES = [
  '/musician/calendar',
  '/musician/opportunities',
  '/musician/dashboard',
] as const;

const SWIPE_THRESHOLD = 50;   // px de desplazamiento mínimo
const SWIPE_VELOCITY  = 250;  // px/s de velocidad mínima

interface SwipeWrapperProps {
  children: ReactNode;
}

export const SwipeWrapper = ({ children }: SwipeWrapperProps) => {
  const navigate   = useNavigate();
  const { pathname } = useLocation();

  const currentIndex = HUB_ROUTES.findIndex(r => pathname === r || pathname.startsWith(r + '/'));

  // Si la ruta actual no es una de las 3 principales, renderiza sin gesto
  if (currentIndex === -1) {
    return <>{children}</>;
  }

  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    const ox = info.offset.x;
    const vx = info.velocity.x;

    const swipedLeft  = ox < -SWIPE_THRESHOLD || vx < -SWIPE_VELOCITY;
    const swipedRight = ox >  SWIPE_THRESHOLD || vx >  SWIPE_VELOCITY;

    if (swipedLeft  && currentIndex < HUB_ROUTES.length - 1) {
      navigate(HUB_ROUTES[currentIndex + 1]);
    }
    if (swipedRight && currentIndex > 0) {
      navigate(HUB_ROUTES[currentIndex - 1]);
    }
  };

  return (
    <motion.div
      drag="x"
      dragElastic={{ left: 0.07, right: 0.07 }}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      style={{ touchAction: 'pan-y', height: '100%', width: '100%' }}
    >
      {children}
    </motion.div>
  );
};
