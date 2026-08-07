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
  mainGenre: 'acoustic',
  shortBio: 'Dúo acústico especializado en covers de clásicos del rock y pop en formato íntimo. Perfecto para atardeceres y sesiones chill.',
  contactPhone: '+34600123456',
  contactWhatsapp: '+34600123456',
  spotifyUrl: 'https://open.spotify.com/artist/example',
  youtubeUrl: 'https://youtube.com/watch?v=example',
  technicalRider: 'Llevamos nuestra propia mesa de mezclas. Necesitamos 2 tomas de corriente y 2 envíos a PA.',
  rating: 4.9,
  reviewsCount: 14,
};

export const mockMusicianCalendar: MusicianCalendar = {
  '2026-08-15': 'unavailable',
  '2026-08-25': 'available',
  '2026-08-26': 'available',
};
