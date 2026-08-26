import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export const useSosAlerts = () => {
  const [activeSosCount, setActiveSosCount] = useState(0);

  useEffect(() => {
    // Si la DB tiene status active
    const q = query(collection(db, 'sos_alerts'), where('status', '==', 'active'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Si la query falla por índices o algo, usamos un try/catch o quitamos el where
      setActiveSosCount(snapshot.size);
    }, (error) => {
      console.warn("Error SOS:", error);
      // Fallback sin index o con todos
      const qAll = query(collection(db, 'sos_alerts'));
      onSnapshot(qAll, (snap) => {
        const count = snap.docs.filter(d => d.data().status === 'active').length;
        setActiveSosCount(count);
      });
    });

    return () => unsubscribe();
  }, []);

  return { activeSosCount };
};
