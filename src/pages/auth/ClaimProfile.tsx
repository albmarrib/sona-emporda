import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { FiMail, FiLock, FiCheck } from 'react-icons/fi';
import { Header } from '../../components/public/Header';

export const ClaimProfile = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [roleRedirect, setRoleRedirect] = useState('');

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');
    setLoading(true);

    try {
      // 1. Buscar en Firestore si existe este email como 'unclaimed'
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('email', '==', email.trim()),
        where('claimStatus', '==', 'unclaimed')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('Perfil no encontrado o ya reclamado. Comprueba que el email sea correcto.');
        setLoading(false);
        return;
      }

      // Tomamos el primer documento que coincida (asumiendo uno por email)
      const unclaimedDoc = querySnapshot.docs[0];
      const unclaimedId = unclaimedDoc.id;
      const unclaimedData = unclaimedDoc.data();

      // 2. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const newUid = userCredential.user.uid;

      // 3. Preparar el Batch de Firestore
      const batch = writeBatch(db);

      // Copiar datos del usuario antiguo al nuevo UID, y cambiar estado a 'claimed'
      const newUserRef = doc(db, 'users', newUid);
      batch.set(newUserRef, {
        ...unclaimedData,
        claimStatus: 'claimed',
        claimedAt: new Date().toISOString()
      });

      // Buscar eventos donde este usuario sea músico
      const eventsAsMusicianQuery = query(collection(db, 'events'), where('musicianId', '==', unclaimedId));
      const eventsAsMusicianSnap = await getDocs(eventsAsMusicianQuery);
      eventsAsMusicianSnap.forEach((eventDoc) => {
        batch.update(eventDoc.ref, { musicianId: newUid });
      });

      // Buscar eventos donde este usuario sea local
      const eventsAsVenueQuery = query(collection(db, 'events'), where('venueId', '==', unclaimedId));
      const eventsAsVenueSnap = await getDocs(eventsAsVenueQuery);
      eventsAsVenueSnap.forEach((eventDoc) => {
        batch.update(eventDoc.ref, { venueId: newUid });
      });

      // Eliminar el documento antiguo
      const oldUserRef = doc(db, 'users', unclaimedId);
      batch.delete(oldUserRef);

      // 4. Ejecutar el Batch
      await batch.commit();

      setRoleRedirect(unclaimedData.role || 'musician');
      setSuccess(true);
      
      setTimeout(() => {
        navigate(`/${unclaimedData.role || 'musician'}`);
      }, 2000);
      
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('El email ya está registrado en la base de datos de autenticación.');
      } else {
        setError(err.message || 'Error al crear la cuenta y reclamar el perfil.');
      }
    } finally {
      if (!success) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {error ? (
            <div className="bg-red-900/20 border border-red-900 text-red-500 p-6 rounded-sm text-center mb-6">
              <p className="text-sm uppercase tracking-widest mb-4">Error</p>
              <p>{error}</p>
              <button 
                onClick={() => setError('')}
                className="mt-6 w-full border border-red-900/50 hover:bg-red-900/20 text-white py-3 rounded-sm transition-all duration-300 text-xs uppercase tracking-widest"
              >
                Volver a intentar
              </button>
            </div>
          ) : null}
          
          {success ? (
            <div className="bg-green-900/20 border border-green-900 text-green-500 p-8 rounded-sm text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-green-900/30 flex items-center justify-center mb-6">
                <FiCheck className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-2xl text-white mb-2">¡Perfil Reclamado!</h2>
              <p className="text-sm text-white/70 mb-6">Redirigiendo a tu panel de control...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-10">
                <h1 className="text-4xl font-serif text-gold mb-4">Reclama tu Perfil</h1>
                <p className="text-white/60 text-sm">
                  Introduce el email con el que fuiste registrado para tomar el control de tu cuenta y asignar una contraseña.
                </p>
              </div>

              <form onSubmit={handleClaim} className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-sm py-3 pl-12 pr-4 text-white focus:outline-none focus:border-gold transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
                    Crea una Contraseña
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-sm py-3 pl-12 pr-4 text-white focus:outline-none focus:border-gold transition-colors"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold text-black py-4 rounded-sm text-xs uppercase tracking-[0.2em] font-bold hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? 'Procesando...' : 'Reclamar Perfil'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
