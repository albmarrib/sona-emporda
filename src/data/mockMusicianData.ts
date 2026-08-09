export interface MusicianProfile {
  id: string;
  stageName: string;
  formationType: 'solo' | 'duo' | 'band';
  membersCount: number;
  membersNames: string;
  mainGenre: string;
  shortBio: string;
  contactPhone: string;
  contactWhatsapp: string;
  spotifyUrl: string;
  youtubeUrl: string;
  technicalRider: string;
  rating: number;
  reviewsCount: number;
  profileImageUrl?: string;
}

export type DayStatus = 'available' | 'unavailable' | 'booked';

export interface MusicianCalendar {
  [dateIso: string]: DayStatus;
}

// Datos simulados para inyectar globalmente
export const mockMusicianProfile: MusicianProfile = {
  id: 'musician-123',
  stageName: 'Acústico Sunset',
  formationType: 'duo',
  membersCount: 2,
  membersNames: 'Carlos Ruiz (Guitarra), Ana Silva (Voz)',
  mainGenre: 'Acústico',
  shortBio: 'Dúo acústico especializado en covers de clásicos del rock y pop en formato íntimo. Perfecto para atardeceres y sesiones chill.',
  contactPhone: '+34600123456',
  contactWhatsapp: '+34600123456',
  spotifyUrl: 'https://open.spotify.com/artist/example',
  youtubeUrl: 'https://youtube.com/watch?v=example',
  technicalRider: 'Llevamos nuestra propia mesa de mezclas. Necesitamos 2 tomas de corriente y 2 envíos a PA.',
  rating: 4.9,
  reviewsCount: 14,
  profileImageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=1600'
};

export const mockMusicianCalendar: MusicianCalendar = {
  '2026-08-15': 'unavailable',
  '2026-08-25': 'available',
  '2026-08-26': 'available',
};

export const allMockMusicians = [
  { ...mockMusicianProfile, calendar: mockMusicianCalendar },
  { 
    id: "musician-456", 
    stageName: "Midnight Jazz Trio", 
    mainGenre: "Jazz",
    profileImageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=1600",
    rating: 4.5,
    reviewsCount: 8,
    formationType: "band",
    membersCount: 3,
    membersNames: "Luis (Piano), Sara (Batería), Toni (Saxo)",
    technicalRider: "Piano acústico o teclado con soporte. Microfonía para saxo y batería. Iluminación tenue.",
    youtubeUrl: "https://youtube.com/watch",
    calendar: { '2026-08-15': 'booked', '2026-08-25': 'available' } as Record<string, string>
  },
  { 
    id: "musician-789", 
    stageName: "DJ Riera", 
    mainGenre: "Electrónica",
    profileImageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1600",
    rating: 4.8,
    reviewsCount: 32,
    formationType: "solo",
    membersCount: 1,
    membersNames: "Marc Riera",
    technicalRider: "Mesa Pioneer CDJ-2000 Nexus o superior. 2 monitores potentes en cabina. Mesa amplia.",
    spotifyUrl: "https://spotify.com",
    calendar: {} as Record<string, string>
  }
];
