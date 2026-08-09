import fs from 'fs';

let content = fs.readFileSync('src/pages/venue/ArtistSearch.tsx', 'utf8');

// 1. Imports
content = content.replace(
  "import { mockMusicianProfile } from '../../data/mockMusicianData';",
  "import { allMockMusicians } from '../../data/mockMusicianData';\nimport { EPKModal } from '../../components/shared/EPKModal';"
);

// 2. Remove VenueSearchResult interface and mockResults
content = content.replace(/interface VenueSearchResult \{[\s\S]*?phone\?: string;\n\}\n/, '');
content = content.replace(/\/\/ Generamos algunos datos extra mockeados rápidamente mezclando el mock base[\s\S]*?\];\n/, '');

// 3. Update state
content = content.replace(
  "  const [searchQuery, setSearchQuery] = useState('');",
  "  const [searchQuery, setSearchQuery] = useState('');\n  const [aiInput, setAiInput] = useState('');\n  const [aiMessages, setAiMessages] = useState<{sender: 'user' | 'ai', text: string}[]>([]);"
);

content = content.replace(
  "  const [selectedArtist, setSelectedArtist] = useState<VenueSearchResult | null>(null);",
  "  const [selectedArtist, setSelectedArtist] = useState<any | null>(null);"
);

// 4. Update filtering to use allMockMusicians
content = content.replace(
  "const filteredResults = mockResults.filter(artist => {",
  "const filteredResults = allMockMusicians.filter(artist => {"
);
content = content.replace(
  "artist.name.toLowerCase().includes(searchQuery.toLowerCase())",
  "artist.stageName.toLowerCase().includes(searchQuery.toLowerCase())"
);
content = content.replace(
  "artist.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))",
  "artist.mainGenre.toLowerCase().includes(searchQuery.toLowerCase())"
);
content = content.replace(
  "const matchesGenre = genreFilter === 'Todos' || artist.genres.includes(genreFilter);",
  "const matchesGenre = genreFilter === 'Todos' || artist.mainGenre === genreFilter;"
);

// 5. Update handleContact signature
content = content.replace(
  "const handleContact = async (artist: VenueSearchResult) => {",
  "const handleContact = async (artist: any) => {"
);
content = content.replace(
  /description: `¡Hola \$\{artist.name\}! Nos gustaría ofrecerte un bolo. Por favor, revisa esta propuesta y envíanos tu EPK.`,/,
  "description: `¡Hola ${artist.stageName}! Nos gustaría ofrecerte un bolo. Por favor, revisa esta propuesta y envíanos tu EPK.`,"
);

// 6. Fix Chat UI rendering
const oldChatRender = `            {/* Example user message */}
            {searchQuery && (
              <div className="flex gap-4 max-w-2xl self-end flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <span className="text-[10px] text-white/50">TÚ</span>
                </div>
                <div className="bg-gold/10 border border-gold/20 p-4 rounded-l-xl rounded-br-xl">
                  <p className="text-sm text-white leading-relaxed">
                    {searchQuery}
                  </p>
                </div>
              </div>
            )}`;

const newChatRender = `            {/* Chat Messages */}
            {aiMessages.map((msg, idx) => (
              <div key={idx} className={\`flex gap-4 max-w-2xl \${msg.sender === 'user' ? 'self-end flex-row-reverse' : ''}\`}>
                <div className={\`w-8 h-8 rounded-full flex items-center justify-center shrink-0 \${msg.sender === 'user' ? 'bg-white/10 border border-white/20' : 'bg-gold/20 border border-gold/50'}\`}>
                  {msg.sender === 'user' ? <span className="text-[10px] text-white/50">TÚ</span> : <FiSearch className="text-gold w-4 h-4" />}
                </div>
                <div className={\`p-4 \${msg.sender === 'user' ? 'bg-gold/10 border border-gold/20 rounded-l-xl rounded-br-xl' : 'bg-white/5 border border-white/10 rounded-r-xl rounded-bl-xl'}\`}>
                  <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}`;

content = content.replace(oldChatRender, newChatRender);

// 7. Fix Chat Input
const oldChatInput = `              <input 
                type="text" 
                placeholder="Escribe tu petición aquí..." 
                className="w-full bg-white/5 border border-white/10 py-4 pl-4 pr-16 text-sm text-white focus:border-gold focus:outline-none focus:bg-white/10 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchQuery(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />`;

const newChatInput = `              <input 
                type="text" 
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Escribe tu petición aquí..." 
                className="w-full bg-white/5 border border-white/10 py-4 pl-4 pr-16 text-sm text-white focus:border-gold focus:outline-none focus:bg-white/10 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && aiInput.trim() !== '') {
                    const newMsg = { sender: 'user' as const, text: aiInput };
                    setAiMessages(prev => [...prev, newMsg]);
                    setAiInput('');
                    
                    // Simulate AI response
                    setTimeout(() => {
                      setAiMessages(prev => [...prev, { 
                        sender: 'ai', 
                        text: "He analizado tu petición y he pre-filtrado algunas opciones basándome en el estilo y caché que buscas. \\n\\nPuedes ir a la pestaña 'Buscador Clásico' arriba para ver las tarjetas con los músicos que mejor encajan." 
                      }]);
                    }, 1000);
                  }
                }}
              />`;

content = content.replace(oldChatInput, newChatInput);

// 8. Fix Classic Search UI mapping
content = content.replace(/artist\.name/g, "artist.stageName");
content = content.replace(/artist\.bio/g, "artist.shortBio");
content = content.replace(/artist\.genres\.map\(g => \(/g, "[artist.mainGenre].map(g => (");
content = content.replace(
  /\{artist\.location\}/g,
  "{artist.location || 'Catalunya'}"
);

// 9. Replace Modal
const oldModalRegex = /\{\/\* EPK Modal \*\/\}\s*\{selectedArtist && \([\s\S]*?\}\)\}\s*<\/div>\s*\);\s*\};/g;
const newModal = `{/* EPK Modal */}
      {selectedArtist && (
        <EPKModal 
          artist={selectedArtist} 
          dateKey="" 
          currentUser={currentUser} 
          onClose={() => setSelectedArtist(null)} 
          onContacted={() => {
            handleContact(selectedArtist);
          }}
        />
      )}
    </div>
  );
};`;
content = content.replace(oldModalRegex, newModal);

fs.writeFileSync('src/pages/venue/ArtistSearch.tsx', content);
