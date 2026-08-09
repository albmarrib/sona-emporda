import fs from 'fs';
import path from 'path';

function patchFile(filepath, replacements) {
    let content = fs.readFileSync(filepath, 'utf8');
    for (let [from, to] of replacements) {
        content = content.split(from).join(to);
    }
    fs.writeFileSync(filepath, content);
}

// 1. EventManager.tsx - change tags to vibes, add default coordinates
patchFile('./src/pages/venue/EventManager.tsx', [
    ['selectedTags:', 'vibes:'],
    ['tags: newEvent.selectedTags', 'vibes: newEvent.vibes'],
    ['newEvent.selectedTags', 'newEvent.vibes'],
    ['toggleTag(tag)', 'toggleVibe(tag)'],
    ['const toggleTag = (tag: string)', 'const toggleVibe = (tag: string)'],
    ['availableTags', 'availableVibes'],
    ['tags para', 'etiquetas (vibes) para'],
    ['eventData = {', 'eventData = {\n        coordinates: { lat: 41.85, lng: 3.10 },\n        description: "Sin descripción por ahora.",'],
]);

// 2. EventCard.tsx - handle undefined vibes
patchFile('./src/components/public/EventCard.tsx', [
    ['event.vibes.map', '(event.vibes || []).map'],
]);

// 3. VenueList.tsx - handle undefined coordinates and vibes
patchFile('./src/components/public/VenueList.tsx', [
    ['event.vibes.some', '(event.vibes || []).some'],
    ['filteredEvents.map(event => (', 'filteredEvents.map(event => {\n            if(!event.coordinates) return null;\n            return ('],
    ['</Popup>\n            </Marker>\n          ))}', '</Popup>\n            </Marker>\n          );})}'],
]);

// 4. Home.tsx - handle undefined vibes
patchFile('./src/pages/public/Home.tsx', [
    ['e.vibes?.some', '(e.vibes || []).some'],
]);

console.log("Patched!");
