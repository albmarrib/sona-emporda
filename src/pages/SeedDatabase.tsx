import { useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export const SeedDatabase = () => {
  const [status, setStatus] = useState<string>('Listo para limpiar la base de datos');
  const [loading, setLoading] = useState(false);

  const protectedEmails = [
    'axonai.ia@gmail.com',
    'alberto-martinez@idexx.com',
    'albmarrib@gmail.com'
  ];

  const handleWipe = async () => {
    if (!window.confirm("ATENCIÓN: Esto borrará TODOS los datos excepto tus 3 cuentas. ¿Estás seguro?")) return;
    
    setLoading(true);
    setStatus('Iniciando borrado...');
    
    try {
      // 1. Borrar eventos
      setStatus('Borrando eventos...');
      const eventsSnap = await getDocs(collection(db, 'events'));
      for (const eventDoc of eventsSnap.docs) {
        await deleteDoc(doc(db, 'events', eventDoc.id));
      }

      // 2. Borrar SOS
      setStatus('Borrando alertas SOS...');
      const sosSnap = await getDocs(collection(db, 'sos_alerts'));
      for (const sosDoc of sosSnap.docs) {
        await deleteDoc(doc(db, 'sos_alerts', sosDoc.id));
      }

      // 3. Borrar booking_proposals (si existen)
      setStatus('Borrando propuestas...');
      const proposalsSnap = await getDocs(collection(db, 'booking_proposals'));
      for (const propDoc of proposalsSnap.docs) {
        await deleteDoc(doc(db, 'booking_proposals', propDoc.id));
      }

      // 4. Borrar chats
      setStatus('Borrando chats...');
      const chatsSnap = await getDocs(collection(db, 'chats'));
      for (const chatDoc of chatsSnap.docs) {
        await deleteDoc(doc(db, 'chats', chatDoc.id));
      }

      // 5. Borrar usuarios (excepto los protegidos)
      setStatus('Limpiando usuarios...');
      const usersSnap = await getDocs(collection(db, 'users'));
      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        if (!protectedEmails.includes(userData.email)) {
          await deleteDoc(doc(db, 'users', userDoc.id));
        }
      }

      setStatus('✅ Limpieza completada con éxito. Base de datos vacía (preservando tus cuentas).');
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
        <h1 className="text-3xl font-serif text-red-500">Wipe Database</h1>
        <p className="text-white/60 text-sm">
          Esto eliminará todos los datos de Firestore (eventos, chats, SOS, y usuarios) 
          EXCEPTO tus cuentas: {protectedEmails.join(', ')}.
        </p>
        
        <div className="p-4 bg-white/5 border border-white/10 text-xs font-mono break-all text-left">
          Status: <span className={status.includes('Error') ? 'text-red-500' : 'text-green-500'}>{status}</span>
        </div>

        <button 
          onClick={handleWipe}
          disabled={loading}
          className="bg-red-500 text-white font-bold uppercase tracking-widest py-4 px-8 hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Borrando...' : '🔥 BORRAR TODO 🔥'}
        </button>
      </div>
    </div>
  );
};
