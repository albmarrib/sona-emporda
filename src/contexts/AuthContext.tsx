import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, messaging } from '../firebase/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';

interface AuthContextType {
  currentUser: User | null;
  userRole: string | null;
  userData: any | null;
  loading: boolean;
  requestPushPermission: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userRole: null,
  userData: null,
  loading: true,
  requestPushPermission: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Escuchar el documento del usuario en tiempo real
        unsubscribeSnapshot = onSnapshot(
          doc(db, 'users', user.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUserRole(data.role);
              setUserData(data);
            } else {
              setUserRole('public');
              setUserData(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching user role:", error);
            setUserRole('public');
            setUserData(null);
            setLoading(false);
          }
        );
      } else {
        setUserRole(null);
        setUserData(null);
        setLoading(false);
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const requestPushPermission = async () => {
    if (!currentUser || !messaging) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const currentToken = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
        if (currentToken) {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            fcmTokens: arrayUnion(currentToken)
          });
        }
      }
    } catch (e) {
      console.error("Error requesting push permission:", e);
    }
  };

  const value = {
    currentUser,
    userRole,
    userData,
    loading,
    requestPushPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
