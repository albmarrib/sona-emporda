import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export const useSosAlerts = () => {
  const [activeSosCount, setActiveSosCount] = useState(0);
  const [activeCollabCount, setActiveCollabCount] = useState(0);

  useEffect(() => {
    const qAll = query(collection(db, 'sos_alerts'));
    
    const unsubscribe = onSnapshot(qAll, (snap) => {
      const activeDocs = snap.docs.filter(d => d.data().status === 'active');
      const sosCount = activeDocs.filter(d => d.data().type === 'sos' || d.data().isUrgent).length;
      const collabCount = activeDocs.filter(d => d.data().type === 'collaboration' && !d.data().isUrgent).length;
      
      setActiveSosCount(sosCount);
      setActiveCollabCount(collabCount);
    });

    return () => unsubscribe();
  }, []);

  return { activeSosCount, activeCollabCount };
};
