import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export const useSosAlerts = (authorId?: string, forVenue?: boolean) => {
  const [activeSosCount, setActiveSosCount] = useState(0);
  const [activeCollabCount, setActiveCollabCount] = useState(0);

  useEffect(() => {
    // Si es para un local pero aún no tenemos su ID (porque Firebase está cargando), no hacemos nada
    if (forVenue && !authorId) {
      setActiveSosCount(0);
      setActiveCollabCount(0);
      return;
    }

    let qAll = query(collection(db, 'sos_alerts'));
    if (authorId) {
      qAll = query(collection(db, 'sos_alerts'), where('authorId', '==', authorId));
    }
    
    const unsubscribe = onSnapshot(qAll, (snap) => {
      const activeDocs = snap.docs.filter(d => d.data().status === 'active');
      const sosCount = activeDocs.filter(d => d.data().type === 'sos' || d.data().isUrgent).length;
      const collabCount = activeDocs.filter(d => d.data().type === 'collaboration' && !d.data().isUrgent).length;
      
      setActiveSosCount(sosCount);
      setActiveCollabCount(collabCount);
    });

    return () => unsubscribe();
  }, [authorId]);

  return { activeSosCount, activeCollabCount };
};
