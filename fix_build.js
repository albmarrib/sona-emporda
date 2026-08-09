import fs from 'fs';

let mockEvents = fs.readFileSync('src/data/mockEvents.ts', 'utf8');
mockEvents = mockEvents.replace(
  "export interface SonaEvent {",
  "export interface SonaEvent {\n  status?: 'draft' | 'published';\n  tags?: string[];"
);
fs.writeFileSync('src/data/mockEvents.ts', mockEvents);

let useEvents = fs.readFileSync('src/hooks/useEvents.ts', 'utf8');
useEvents = useEvents.replace(
  "let eventsList = snapshot.docs.map(doc => ({",
  "let eventsList: any[] = snapshot.docs.map(doc => ({"
);
fs.writeFileSync('src/hooks/useEvents.ts', useEvents);
