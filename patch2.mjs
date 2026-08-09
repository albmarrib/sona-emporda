import fs from 'fs';

let content = fs.readFileSync('./src/components/public/EventCalendar.tsx', 'utf8');
content = content.replace(/e\.vibes\.some/g, '(e.vibes || e.tags || []).some');
fs.writeFileSync('./src/components/public/EventCalendar.tsx', content);

console.log("Patched EventCalendar");
