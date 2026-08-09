import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB0cjn1bSmYg3JsuBLYw0wFIrx62-qlJwU",
  authDomain: "sona-emporda.firebaseapp.com",
  projectId: "sona-emporda",
  storageBucket: "sona-emporda.firebasestorage.app",
  messagingSenderId: "616535257427",
  appId: "1:616535257427:web:e60605f9efd1bea13f71a6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  try {
    await addDoc(collection(db, 'events'), {
      title: "Gran Fiesta de Reapertura",
      date: "2026-08-15T22:00:00Z",
      time: "22:00",
      ticketType: "Entrada Libre",
      imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800",
      tags: ["Fiesta", "Electrónica"],
      acceptsReservations: false,
      reservationContact: "",
      venueName: "Sala Soho",
      location: "Dirección de Sala Soho",
      createdAt: new Date().toISOString()
    });
    console.log("Seeded successfully");
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
seed();
