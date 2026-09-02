import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { FiMail, FiLock } from 'react-icons/fi';
import { Header } from '../../components/public/Header';

export const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'musician' | 'venue'>('musician');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Por favor, introduce tu email para recuperar la contraseña.');
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError('Error al enviar el correo de recuperación.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          const actualRole = userDoc.data().role || 'musician';
          navigate(`/${actualRole}`);
        } else {
          // Failsafe: Si el usuario existe en Auth pero no en Firestore
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email,
            role,
            createdAt: new Date().toISOString()
          });
          navigate(`/${role}`);
        }
      } else {
        // REGISTRO
        
        // 1. Buscar si existe perfil fantasma (unclaimed)
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef, 
          where('email', '==', email.trim()),
          where('claimStatus', '==', 'unclaimed')
        );
        const querySnapshot = await getDocs(q);

        // 2. Crear usuario en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const newUid = userCredential.user.uid;

        if (!querySnapshot.empty) {
          // --- FUSIÓN DE PERFIL FANTASMA ---
          const unclaimedDoc = querySnapshot.docs[0];
          const unclaimedId = unclaimedDoc.id;
          const unclaimedData = unclaimedDoc.data();

          const batch = writeBatch(db);

          // Crear nuevo doc
          const newUserRef = doc(db, 'users', newUid);
          batch.set(newUserRef, {
            ...unclaimedData,
            claimStatus: 'claimed',
            claimedAt: new Date().toISOString()
          });

          // Actualizar eventos donde es músico
          const eventsAsMusicianQuery = query(collection(db, 'events'), where('musicianId', '==', unclaimedId));
          const eventsAsMusicianSnap = await getDocs(eventsAsMusicianQuery);
          eventsAsMusicianSnap.forEach((eventDoc) => {
            batch.update(eventDoc.ref, { musicianId: newUid });
          });

          // Actualizar eventos donde es local
          const eventsAsVenueQuery = query(collection(db, 'events'), where('venueId', '==', unclaimedId));
          const eventsAsVenueSnap = await getDocs(eventsAsVenueQuery);
          eventsAsVenueSnap.forEach((eventDoc) => {
            batch.update(eventDoc.ref, { venueId: newUid });
          });

          // Eliminar el documento antiguo
          const oldUserRef = doc(db, 'users', unclaimedId);
          batch.delete(oldUserRef);

          // Ejecutar batch
          await batch.commit();

          const finalRole = unclaimedData.role || role;
          navigate(`/${finalRole}`);

        } else {
          // --- REGISTRO NORMAL (Sin perfil fantasma) ---
          await setDoc(doc(db, 'users', newUid), {
            email: email.trim(),
            role,
            createdAt: new Date().toISOString()
          });
          
          navigate(`/${role}`);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de autenticación. Revisa tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-black border border-white/10 shadow-2xl p-8 md:p-12">
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-serif text-white mb-2">
              {isLogin ? 'Acceso Privado' : 'Únete a Sona Empordà'}
            </h2>
            <p className="text-white/40 text-xs uppercase tracking-widest">
              {isLogin ? 'Introduce tus credenciales' : 'Crea tu cuenta profesional'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 border border-red-900/50 bg-red-900/10 text-red-500 text-xs uppercase tracking-widest text-center">
              {error}
            </div>
          )}
          {resetSent && (
            <div className="mb-6 p-4 border border-green-900/50 bg-green-900/10 text-green-500 text-xs uppercase tracking-widest text-center">
              Correo de recuperación enviado. Revisa tu bandeja de entrada.
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            {!isLogin && (
              <div className="flex flex-col gap-2">
                <label className="text-gold text-[10px] uppercase tracking-widest font-bold">Tipo de Cuenta</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole('musician')}
                    className={`py-3 text-xs uppercase tracking-widest transition-colors border ${
                      role === 'musician' ? 'bg-gold text-black border-gold' : 'bg-transparent text-white/50 border-white/10 hover:border-white/30'
                    }`}
                  >
                    Soy Músico
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('venue')}
                    className={`py-3 text-xs uppercase tracking-widest transition-colors border ${
                      role === 'venue' ? 'bg-gold text-black border-gold' : 'bg-transparent text-white/50 border-white/10 hover:border-white/30'
                    }`}
                  >
                    Soy Local
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Email</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 py-3 pl-12 pr-4 text-sm font-sans text-white focus:outline-none focus:border-gold transition-colors"
                  placeholder="tucorreo@ejemplo.com"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Contraseña</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 py-3 pl-12 pr-4 text-sm font-sans text-white focus:outline-none focus:border-gold transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-gold text-black font-bold text-xs uppercase tracking-widest py-4 hover:bg-white transition-colors duration-300 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : (isLogin ? 'Entrar' : 'Registrarse')}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/10 pt-6 space-y-4">
            <p className="text-white/40 text-xs">
              {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes una cuenta?'}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-gold hover:text-white transition-colors font-bold uppercase tracking-widest text-[10px]"
              >
                {isLogin ? 'Regístrate aquí' : 'Inicia Sesión'}
              </button>
            </p>
            {isLogin && (
              <p className="text-white/40 text-xs">
                ¿Has olvidado tu contraseña?
                <button 
                  onClick={handleResetPassword}
                  type="button"
                  className="ml-2 text-gold hover:text-white transition-colors font-bold uppercase tracking-widest text-[10px]"
                >
                  Recuperar Contraseña
                </button>
              </p>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};
