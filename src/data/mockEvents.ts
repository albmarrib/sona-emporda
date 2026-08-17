export interface SonaEvent {
  status?: 'draft' | 'published';
  tags?: string[];
  id: string;
  title: string;
  musicianId?: string;
  musicianName?: string;
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
  applicants?: string[];
}

export const mockEvents: SonaEvent[] = [];
