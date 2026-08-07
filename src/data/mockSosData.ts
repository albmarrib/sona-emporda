export interface SosUrgency {
  id: string;
  title: string;
  venueName: string;
  location: string;
  dateStr: string;
  price: string;
  requiredVibes: string[];
  description: string;
  isUrgent: boolean;
  postedAt: string;
}

export const mockSosUrgencies: SosUrgency[] = [
  {
    id: "sos-1",
    title: "Se busca DJ sustituto para sesión de tardeo",
    venueName: "Sala Soho",
    location: "Palamós",
    dateStr: "Hoy, 22:00h",
    price: "150€",
    requiredVibes: ["🪩 Electrónica", "🌅 Tardeo"],
    description: "Nuestro DJ principal ha tenido un imprevisto médico. Necesitamos a alguien que pueda cubrir una sesión de 3 horas de música electrónica/house suave para el tardeo.",
    isUrgent: true,
    postedAt: "2026-08-07T10:00:00Z"
  },
  {
    id: "sos-2",
    title: "Banda o Solista para cubrir cancelación",
    venueName: "El Xiringuito de la Riera",
    location: "Calonge",
    dateStr: "Mañana, 13:00h",
    price: "200€",
    requiredVibes: ["🎸 Acústico", "💃 Rumba"],
    description: "Se nos ha caído el grupo del vermut de mañana. Buscamos a alguien que anime el ambiente durante un par de horas.",
    isUrgent: true,
    postedAt: "2026-08-07T08:30:00Z"
  },
  {
    id: "sos-3",
    title: "Pianista para cena romántica",
    venueName: "Restaurante La Cúpula",
    location: "Begur",
    dateStr: "Viernes, 21:00h",
    price: "120€",
    requiredVibes: ["🎹 Jazz", "🍷 Cena"],
    description: "Buscamos pianista para amenizar las cenas de los viernes. Ambiente muy tranquilo y elegante. Disponemos de piano de cola en el local.",
    isUrgent: false,
    postedAt: "2026-08-06T18:15:00Z"
  }
];
