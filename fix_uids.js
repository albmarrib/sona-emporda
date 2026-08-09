import fs from 'fs';

function replaceInFile(filepath, replaces) {
  let content = fs.readFileSync(filepath, 'utf8');
  for (let r of replaces) {
    content = content.split(r[0]).join(r[1]);
  }
  fs.writeFileSync(filepath, content);
}

replaceInFile('./src/pages/venue/EventManager.tsx', [
  ['const { userData } = useAuth();', 'const { userData, currentUser } = useAuth();'],
  ['if (!userData?.uid) return;', 'if (!currentUser?.uid) return;'],
  ['userData.uid', 'currentUser?.uid'],
  ['userData?.uid', 'currentUser?.uid']
]);

replaceInFile('./src/pages/venue/VenueDashboardHome.tsx', [
  ['const { events } = useEvents();\n  const { userData } = useAuth();', 'const { events } = useEvents();\n  const { userData, currentUser } = useAuth();'],
  ['const venueId = userData?.uid;', 'const venueId = currentUser?.uid;']
]);

replaceInFile('./src/pages/venue/VenueCalendar.tsx', [
  ['const { userData } = useAuth();', 'const { userData, currentUser } = useAuth();'],
  ['const venueId = userData?.uid;', 'const venueId = currentUser?.uid;']
]);

console.log('Fixed uids!');
