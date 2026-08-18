export interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  locationLink?: string;
  description?: string;
  requirements?: string;
  payment?: string;
  genre?: string;
  status: 'published' | 'confirmed' | 'cancelled';
  venueId?: string;
  venueName?: string;
  musicianId?: string;
  flyerUrl?: string;
  createdAt: string;
  updatedAt: string;
  // Sponsorship fields
  sponsorName?: string | null;
  sponsorImageUrl?: string | null;
  sponsorLink?: string | null;
  sponsorMessage?: string | null;
  sponsorTier?: number | null;
}
