import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiBriefcase, FiList } from 'react-icons/fi';

// ─── Placeholder Views ────────────────────────────────────────────────────────
// Estas vistas serán reemplazadas por los componentes reales en el futuro.

const AgendaView = () => (
  <div className="flex flex-col items-center justify-center h-full gap-4 text-white/20">
    <FiCalendar className="w-16 h-16" />
    <p className="text-sm uppercase tracking-widest font-bold">Agenda</p>
    <p className="text-xs text-white/30">El calendario de disponibilidad irá aquí</p>
  </div>
);

const OportunidadesView = () => (
  <div className="flex flex-col items-center justify-center h-full gap-4 text-white/20">
    <FiBriefcase className="w-16 h-16" />
    <p className="text-sm uppercase tracking-widest font-bold">Oportunidades</p>
    <p className="text-xs text-white/30">Las ofertas de locales irán aquí</p>
  </div>
);

const EventosProgramadosView = () => (
  <div className="flex flex-col items-center justify-center h-full gap-4 text-white/20">
    <FiList className="w-16 h-16" />
    <p className="text-sm uppercase tracking-widest font-bold">Eventos Programados</p>
    <p className="text-xs text-white/30">La lista de bolos confirmados irá aquí</p>
  </div>
);

// ─── Tab Config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'agenda',   label: 'Agenda',             icon: FiCalendar,  View: AgendaView },
  { id: 'opor',    label: 'Oportunidades',       icon: FiBriefcase, View: OportunidadesView },
  { id: 'eventos', label: 'Eventos\nProgramados', icon: FiList,      View: EventosProgramadosView },
] as const;

// ─── Swipe constants ──────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 60;   // px mínimos para considerar swipe
const SWIPE_VELOCITY  = 300;  // px/s mínima velocidad para considerar swipe

// ─── Component ────────────────────────────────────────────────────────────────

export const MusicianMainHub = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const direction = useRef<1 | -1>(1); // 1 = hacia adelante, -1 = hacia atrás

  const goTo = (index: number) => {
    direction.current = index > activeIndex ? 1 : -1;
    setActiveIndex(index);
  };

  // ── Variants para el slide ──────────────────────────────────────────────────
  const slideVariants = {
    enter:  (dir: number) => ({ x: dir * 100 + '%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (dir: number) => ({ x: dir * -100 + '%', opacity: 0 }),
  };

  // ── Drag handler ────────────────────────────────────────────────────────────
  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    const { x: offsetX } = info.offset;
    const { x: velX }    = info.velocity;

    const isSwipeLeft  = offsetX < -SWIPE_THRESHOLD || velX < -SWIPE_VELOCITY;
    const isSwipeRight = offsetX >  SWIPE_THRESHOLD || velX >  SWIPE_VELOCITY;

    if (isSwipeLeft  && activeIndex < TABS.length - 1) goTo(activeIndex + 1);
    if (isSwipeRight && activeIndex > 0)               goTo(activeIndex - 1);
  };

  const { View } = TABS[activeIndex];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">

      {/* ── Tab Bar ─────────────────────────────────────────────────────────── */}
      <nav
        className="
          flex-shrink-0
          flex items-stretch
          bg-black/80 backdrop-blur-md
          border-b border-white/10
          relative z-10
        "
        role="tablist"
      >
        {TABS.map((tab, i) => {
          const Icon     = tab.icon;
          const isActive = i === activeIndex;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`hub-panel-${tab.id}`}
              id={`hub-tab-${tab.id}`}
              onClick={() => goTo(i)}
              className={`
                relative flex-1 flex flex-col items-center justify-center
                gap-1 py-3 px-1
                text-[10px] uppercase tracking-widest font-bold
                transition-colors duration-200 select-none
                ${isActive ? 'text-gold' : 'text-white/35 hover:text-white/60'}
              `}
            >
              {/* Icono */}
              <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`} />

              {/* Etiqueta — permite salto de línea con \n */}
              <span className="leading-tight text-center whitespace-pre-line">
                {tab.label}
              </span>

              {/* Indicador activo — línea dorada animada */}
              {isActive && (
                <motion.div
                  layoutId="hub-tab-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-2/3 bg-gold rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Swipeable Content ───────────────────────────────────────────────── */}
      <div
        className="flex-1 relative overflow-hidden"
        role="tabpanel"
        id={`hub-panel-${TABS[activeIndex].id}`}
        aria-labelledby={`hub-tab-${TABS[activeIndex].id}`}
      >
        <AnimatePresence initial={false} custom={direction.current} mode="popLayout">
          <motion.div
            key={activeIndex}
            custom={direction.current}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x:       { type: 'spring', stiffness: 380, damping: 38, mass: 0.9 },
              opacity: { duration: 0.12 },
            }}
            drag="x"
            dragElastic={{ left: 0.12, right: 0.12 }}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            style={{ touchAction: 'pan-y' }}
            className="absolute inset-0 will-change-transform"
          >
            <View />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
