export interface SonaEvent {
  status?: 'draft' | 'published' | 'confirmed';
  tags?: string[];
  id: string;
  title: string;
  musicianId?: string;
  musicianName?: string;
  date: string;
  venueName: string;
  venueId?: string;
  venueLocation: string;
  imageUrl: string;
  vibes: string[];
  isSponsored?: boolean;
  sponsorName?: string;
  sponsorImageUrl?: string;
  sponsorLink?: string;
  sponsorMessage?: string;
  sponsorTier?: number;
  ticketType: "Gratis" | "Reserva Mesa" | "Comprar Entrada" | string;
  coordinates: {
    lat: number;
    lng: number;
  };
  applicants?: string[];
}

export interface MusicianProfile {
  id: string;
  stageName: string;
  formationType: 'solo' | 'duo' | 'band' | string;
  membersCount: number;
  membersNames: string;
  mainGenre: string;
  baseLocation?: string;
  shortBio: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactEmail?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  technicalRider: string;
  rating: number;
  reviewsCount: number;
  profileImageUrl?: string;
  customApplyMessage?: string;
}

export type DayStatus = 'available' | 'unavailable' | 'booked' | 'booked_full' | 'booked_partial';

export interface MusicianCalendar {
  [dateIso: string]: DayStatus;
}

export interface SosUrgency {
  id: string;
  title: string;
  type?: 'sos' | 'collaboration';
  venueName: string;
  venueId?: string;
  location: string;
  dateStr: string;
  price: string;
  requiredVibes: string[];
  description: string;
  isUrgent: boolean;
  postedAt: string;
}
