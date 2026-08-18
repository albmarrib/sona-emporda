const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
async function run() {
  const snapshot = await db.collection('events').get();
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.sponsorTier) {
      console.log(doc.id, data.title, 'Tier:', data.sponsorTier);
    }
  });
}
run().catch(console.error);
