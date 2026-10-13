import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiBriefcase, FiList, FiArrowRight } from 'react-icons/fi';
import { useMusicianProfile } from '../../hooks/useMusicianProfile';
import { useAuth } from '../../contexts/AuthContext';

const CARDS = [
  {
    id: 'agenda',
    label: 'Agenda',
    sublabel: 'Tu calendario de disponibilidad',
    icon: FiCalendar,
    path: '/musician/calendar',
    gradient: 'from-amber-950/60 via-zinc-950 to-zinc-950',
    border: 'border-amber-900/40',
    glow: 'bg-amber-500/10',
    iconColor: 'text-gold',
    pill: 'bg-amber-950/60 text-amber-400 border-amber-900/50',
  },
  {
    id: 'oportunidades',
    label: 'Oportunidades',
    sublabel: 'Ofertas publicadas por locales',
    icon: FiBriefcase,
    path: '/musician/opportunities',
    gradient: 'from-sky-950/50 via-zinc-950 to-zinc-950',
    border: 'border-sky-900/40',
    glow: 'bg-sky-500/10',
    iconColor: 'text-sky-400',
    pill: 'bg-sky-950/60 text-sky-400 border-sky-900/50',
  },
  {
    id: 'eventos',
    label: 'Eventos Programados',
    sublabel: 'Tus bolos confirmados',
    icon: FiList,
    path: '/musician/dashboard',
    gradient: 'from-emerald-950/50 via-zinc-950 to-zinc-950',
    border: 'border-emerald-900/40',
    glow: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    pill: 'bg-emerald-950/60 text-emerald-400 border-emerald-900/50',
  },
] as const;

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.09, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export const MusicianHome = () => {
  const navigate = useNavigate();
  const { profile } = useMusicianProfile();
  const { currentUser } = useAuth();
  const name = profile?.stageName || currentUser?.displayName || 'Músico';

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto overflow-x-hidden bg-zinc-950">
      {/* Greeting */}
      <div className="flex-shrink-0 px-5 pt-6 pb-4">
        <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-0.5">
          Bienvenido de vuelta
        </p>
        <h1 className="text-2xl font-serif text-white leading-tight truncate">
          {name}
        </h1>
        <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">
          ¿Qué quieres hacer hoy?
        </p>
      </div>

      {/* Cards */}
      <div className="flex-1 flex flex-col gap-3 px-4 pb-6">
        {CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.id}
              id={`hub-card-${card.id}`}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(card.path)}
              className={`
                relative flex-1 min-h-[110px] w-full text-left
                rounded-2xl border ${card.border}
                bg-gradient-to-br ${card.gradient}
                overflow-hidden group
                transition-shadow duration-300
                hover:shadow-lg active:shadow-none
              `}
            >
              {/* Background glow blob */}
              <div
                className={`absolute -top-6 -right-6 w-32 h-32 rounded-full blur-2xl ${card.glow} opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-500`}
              />

              <div className="relative z-10 flex items-center gap-5 h-full px-5 py-5">
                {/* Icon container */}
                <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 ${card.iconColor}`}>
                  <Icon className="w-7 h-7" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] uppercase tracking-widest font-bold mb-2 ${card.pill}`}>
                    {card.label}
                  </div>
                  <p className="text-white/60 text-xs leading-snug truncate">
                    {card.sublabel}
                  </p>
                </div>

                {/* Arrow */}
                <FiArrowRight
                  className={`flex-shrink-0 w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all duration-200`}
                />
              </div>

              {/* Bottom shimmer line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
          );
        })}
      </div>

      {/* Swipe hint */}
      <p className="flex-shrink-0 text-center text-[9px] uppercase tracking-widest text-white/15 pb-5 px-4">
        Desliza entre vistas una vez dentro
      </p>
    </div>
  );
};
