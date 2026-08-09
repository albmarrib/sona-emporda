import fs from 'fs';

function replace(file, search, replaceStr) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.split(search).join(replaceStr);
  fs.writeFileSync(file, content);
}

// 1. Home.tsx
// heroEvents depends on carouselIndex, but if length <= 1, interval doesn't start.
// AND currentHeroEvent might be undefined if we change activeView? No.
replace('./src/pages/public/Home.tsx', 
  '{currentHeroEvent && activeView === "LISTA" && (',
  '{currentHeroEvent && activeView === "LISTA" && heroEvents.length > 0 && ('
);

// 2. EventDetail.tsx
// handle invalid date gracefully
replace('./src/pages/public/EventDetail.tsx',
  'const dateObj = parseISO(event.date);',
  `const dateObj = event.date ? parseISO(event.date) : new Date();
  if (isNaN(dateObj.getTime())) return <div className="text-white text-center p-20">Error: Fecha de evento inválida</div>;`
);

// 3. EventCard.tsx
replace('./src/components/public/EventCard.tsx',
  'const dateObj = parseISO(event.date);',
  `const dateObj = event.date ? parseISO(event.date) : new Date();
  if (isNaN(dateObj.getTime())) return null;`
);
replace('./src/components/public/EventCard.tsx',
  '(event.vibes || []).map',
  '(event.vibes || event.tags || []).map'
);

// 4. VenueList.tsx
replace('./src/components/public/VenueList.tsx',
  'const eventDate = parseISO(event.date);',
  'if (!event.date) return false;\n    const eventDate = parseISO(event.date);\n    if (isNaN(eventDate.getTime())) return false;'
);

// 5. EventCalendar.tsx
replace('./src/components/public/EventCalendar.tsx',
  'isSameDay(parseISO(e.date), day)',
  '(e.date && !isNaN(parseISO(e.date).getTime()) && isSameDay(parseISO(e.date), day))'
);
replace('./src/components/public/EventCalendar.tsx',
  'isSameDay(parseISO(e.date), selectedDate)',
  '(e.date && !isNaN(parseISO(e.date).getTime()) && isSameDay(parseISO(e.date), selectedDate))'
);

console.log("Crash fixes applied.");
