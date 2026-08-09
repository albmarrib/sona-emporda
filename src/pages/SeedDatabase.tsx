import { useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { mockEvents } from '../data/mockEvents';
import { mockSosUrgencies as mockSOS } from '../data/mockSosData';
import { mockMusicianProfile, mockMusicianCalendar } from '../data/mockMusicianData';

export const SeedDatabase = () => {
  const [status, setStatus] = useState<string>('Ready to seed database');
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    setStatus('Seeding started...');
    
    try {
      const batch = writeBatch(db);

      // 1. Seed Events
      setStatus('Seeding events...');
      mockEvents.forEach(event => {
        const docRef = doc(collection(db, 'events'), event.id);
        batch.set(docRef, {
          ...event,
          createdAt: new Date().toISOString()
        });
      });

      // 2. Seed SOS Alerts
      setStatus('Seeding SOS alerts...');
      mockSOS.forEach((sos: any) => {
        const docRef = doc(collection(db, 'sos_alerts'), sos.id);
        batch.set(docRef, {
          ...sos,
          createdAt: new Date().toISOString(),
          applications: [] // For musicians to apply
        });
      });

      // 3. Seed Users (Musicians)
      setStatus('Seeding musicians...');
      const musicianRef = doc(collection(db, 'users'), mockMusicianProfile.id);
      batch.set(musicianRef, {
        ...mockMusicianProfile,
        calendar: mockMusicianCalendar,
        role: 'musician',
        email: 'musico@sonaemporda.com' // Mock email for auth matching
      });

      // Add a couple more mock musicians
      const m2Ref = doc(collection(db, 'users'), 'musician-456');
      batch.set(m2Ref, {
        id: "musician-456", 
        stageName: "Midnight Jazz Trio", 
        mainGenre: "Jazz",
        profileImageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400",
        rating: 4.5,
        reviewsCount: 8,
        calendar: { '2026-08-15': 'booked', '2026-08-25': 'available' },
        role: 'musician'
      });

      const m3Ref = doc(collection(db, 'users'), 'musician-789');
      batch.set(m3Ref, {
        id: "musician-789", 
        stageName: "DJ Riera", 
        mainGenre: "Electrónica",
        profileImageUrl: "https://images.unsplash.com/photo-1542222835-300b12bc173c?auto=format&fit=crop&q=80&w=400",
        rating: 4.8,
        reviewsCount: 32,
        calendar: {},
        role: 'musician'
      });

      // 4. Seed Venue Profile
      setStatus('Seeding venue...');
      const venueRef = doc(collection(db, 'users'), 'venue-123');
      batch.set(venueRef, {
        id: 'venue-123',
        name: 'Sala Soho',
        type: 'Club',
        email: 'local@sonaemporda.com',
        role: 'venue'
      });

      await batch.commit();
      setStatus('✅ Seeding completed successfully!');
    } catch (error: any) {
      console.error(error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-12 flex flex-col items-center justify-center font-sans">
      <div className="bg-zinc-950 border border-white/10 p-8 max-w-lg w-full flex flex-col gap-6 text-center">
        <h1 className="text-3xl font-serif text-gold">Database Seeder</h1>
        <p className="text-white/60 text-sm">
          This will write mock data to Firebase Firestore.
          Make sure your Firestore rules allow writing.
        </p>
        
        <div className="p-4 bg-white/5 border border-white/10 text-xs font-mono break-all text-left">
          Status: <span className={status.includes('Error') ? 'text-red-500' : 'text-green-500'}>{status}</span>
        </div>

        <button 
          onClick={handleSeed}
          disabled={loading}
          className="bg-gold text-black font-bold uppercase tracking-widest py-4 px-8 hover:bg-white transition-colors disabled:opacity-50"
        >
          {loading ? 'Seeding...' : 'Run Seed'}
        </button>
      </div>
    </div>
  );
};
