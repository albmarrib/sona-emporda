import fs from 'fs';

let content = fs.readFileSync('src/pages/venue/VenueCalendar.tsx', 'utf8');

const replacement = `const allMockMusicians = [
  { ...mockMusicianProfile, calendar: mockMusicianCalendar },
  { 
    id: "musician-456", 
    stageName: "Midnight Jazz Trio", 
    mainGenre: "Jazz",
    profileImageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400",
    rating: 4.5,
    reviewsCount: 8,
    formationType: "band",
    membersCount: 3,
    technicalRider: "Piano acústico o teclado con soporte. Microfonía para saxo y batería. Iluminación tenue.",
    youtubeUrl: "https://youtube.com/watch",
    calendar: { '2026-08-15': 'booked', '2026-08-25': 'available' } as Record<string, string>
  },
  { 
    id: "musician-789", 
    stageName: "DJ Riera", 
    mainGenre: "Electrónica",
    profileImageUrl: "https://images.unsplash.com/photo-1542222835-300b12bc173c?auto=format&fit=crop&q=80&w=400",
    rating: 4.8,
    reviewsCount: 32,
    formationType: "solo",
    technicalRider: "Mesa Pioneer CDJ-2000 Nexus o superior. 2 monitores potentes en cabina. Mesa amplia.",
    spotifyUrl: "https://spotify.com",
    calendar: {} as Record<string, string> // No events = implicit availability
  }
];`;

content = content.replace(/const allMockMusicians = \[[\s\S]*?\];/, replacement);

fs.writeFileSync('src/pages/venue/VenueCalendar.tsx', content);
