import fs from 'fs';

let content = fs.readFileSync('src/pages/venue/VenueCalendar.tsx', 'utf8');

// 1. Update ArtistCard click behavior
content = content.replace(
  '<div className="bg-zinc-950 border border-white/10 p-4 hover:border-gold/50 transition-colors flex flex-col gap-3 group cursor-pointer relative overflow-hidden">',
  '<div onClick={onSelect} className="bg-zinc-950 border border-white/10 p-4 hover:border-gold/50 transition-colors flex flex-col gap-3 group cursor-pointer relative overflow-hidden">'
);

// 2. Expand the EPK Modal
const oldEpkModalContent = `              <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 border border-white/10">
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-white/50">Experiencia</h4>
                  <p className="text-lg text-white font-serif">{selectedArtist.experienceYears || "Varios"} años</p>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-white/50">Valoración</h4>
                  <div className="flex items-center gap-1 text-gold">
                    <FiStar className="fill-gold w-4 h-4" />
                    <span className="text-lg text-white font-serif">{selectedArtist.rating}</span>
                  </div>
                </div>
              </div>`;

const newEpkModalContent = `              <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 border border-white/10">
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-white/50">Formación</h4>
                  <p className="text-lg text-white font-serif capitalize">
                    {selectedArtist.formationType || "Solista"} {selectedArtist.membersCount ? \`(\${selectedArtist.membersCount} personas)\` : ''}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-white/50">Valoración</h4>
                  <div className="flex items-center gap-1 text-gold">
                    <FiStar className="fill-gold w-4 h-4" />
                    <span className="text-lg text-white font-serif">{selectedArtist.rating}</span>
                  </div>
                </div>
              </div>

              {(selectedArtist.youtubeUrl || selectedArtist.spotifyUrl) && (
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-white/50 mb-3">ENLACES MULTIMEDIA</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {selectedArtist.youtubeUrl && (
                      <a href={selectedArtist.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-red-600/20 text-red-500 border border-red-600/50 hover:bg-red-600 hover:text-white transition-colors py-3 flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-bold">
                        Ver Video Destacado
                      </a>
                    )}
                    {selectedArtist.spotifyUrl && (
                      <a href={selectedArtist.spotifyUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-500/20 text-green-500 border border-green-500/50 hover:bg-green-500 hover:text-white transition-colors py-3 flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-bold">
                        Escuchar en Spotify
                      </a>
                    )}
                  </div>
                </div>
              )}

              {selectedArtist.technicalRider && (
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-white/50 mb-2">TECHNICAL RIDER (Necesidades)</h3>
                  <div className="bg-white/5 border border-white/10 p-4">
                    <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{selectedArtist.technicalRider}</p>
                  </div>
                </div>
              )}`;

content = content.replace(oldEpkModalContent, newEpkModalContent);

fs.writeFileSync('src/pages/venue/VenueCalendar.tsx', content);
