export interface SonaEvent {
  status?: 'draft' | 'published';
  tags?: string[];
  id: string;
  title: string;
  musicianId?: string;
  date: string;
  venueName: string;
  venueLocation: string;
  imageUrl: string;
  vibes: string[];
  isSponsored: boolean;
  sponsorName?: string;
  ticketType: "Gratis" | "Reserva Mesa" | "Comprar Entrada";
  coordinates: {
    lat: number;
    lng: number;
  };
}

export const mockEvents: SonaEvent[] = [
  {
    id: "evt-1",
    title: "Marlena - Acústico Íntimo",
    date: "2026-08-14T20:00:00Z",
    musicianId: "other-musician",
    venueName: "La Brava Beach Club",
    venueLocation: "Platja d'Aro",
    imageUrl: "https://picsum.photos/seed/sona1/1000/600",
    vibes: ["🎸 Acústico", "🌅 Tardeo"],
    isSponsored: true,
    sponsorName: "Estrella Damm",
    ticketType: "Reserva Mesa",
    coordinates: { lat: 41.815, lng: 3.067 }
  },
  {
    id: "evt-2",
    title: "DJ Nuka - Noche Electrónica",
    date: "2026-08-15T23:30:00Z",
    musicianId: "other-dj",
    venueName: "Sala Soho",
    venueLocation: "Palamós",
    imageUrl: "https://picsum.photos/seed/sona2/1000/600",
    vibes: ["🪩 Electrónica", "🔥 Bailar"],
    isSponsored: false,
    ticketType: "Comprar Entrada",
    coordinates: { lat: 41.848, lng: 3.129 }
  },
  {
    id: "evt-3",
    title: "Vermut Musical con Rumba Brava",
    date: "2026-08-16T12:30:00Z",
    musicianId: "other-band",
    venueName: "El Xiringuito de la Riera",
    venueLocation: "Calonge",
    imageUrl: "https://picsum.photos/seed/sona3/1000/600",
    vibes: ["💃 Rumba", "🍸 Vermut"],
    isSponsored: false,
    ticketType: "Gratis",
    coordinates: { lat: 41.861, lng: 3.076 }
  },
  {
    id: "evt-4",
    title: "Acústico Sunset en el Náutico",
    date: "2026-08-20T21:00:00Z",
    musicianId: "musician-123", // MATCHES OUR MOCK MUSICIAN
    venueName: "Club Náutico",
    venueLocation: "Sant Feliu de Guíxols",
    imageUrl: "https://picsum.photos/seed/sona4/1000/600",
    vibes: ["🎸 Acústico", "🍷 Cena"],
    isSponsored: true,
    sponsorName: "Gin Mare",
    ticketType: "Comprar Entrada",
    coordinates: { lat: 41.777, lng: 3.033 }
  },
  {
    id: "evt-5",
    title: "Atardecer Chill con Acústico Sunset",
    date: "2026-08-24T19:00:00Z",
    musicianId: "musician-123", // MATCHES OUR MOCK MUSICIAN
    venueName: "La Brava Beach Club",
    venueLocation: "Platja d'Aro",
    imageUrl: "https://picsum.photos/seed/sona5/1000/600",
    vibes: ["🎸 Acústico", "🌅 Tardeo"],
    isSponsored: false,
    ticketType: "Gratis",
    coordinates: { lat: 41.815, lng: 3.067 }
  },
  {
    id: "evt-6",
    title: "Tardeo Acústico Pasado",
    date: "2026-07-15T19:00:00Z",
    musicianId: "musician-123", 
    venueName: "Sala Soho",
    venueLocation: "Palamós",
    imageUrl: "https://picsum.photos/seed/sona6/1000/600",
    vibes: ["🎸 Acústico", "🌅 Tardeo"],
    isSponsored: false,
    ticketType: "Gratis",
    coordinates: { lat: 41.848, lng: 3.129 }
  }
];
