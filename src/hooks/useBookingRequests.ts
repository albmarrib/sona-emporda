import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../contexts/AuthContext';

export interface BookingRequest {
  id: string;
  title: string;
  date: string;
  time?: string;
  venueName?: string;
  status?: string;
  type?: string;
  venueId?: string;
  musicianId?: string;
  readByMusician?: boolean;
  externalContact?: {
    name: string;
    email: string;
    phone?: string;
    type?: string;
    details?: string;
  };
  createdAt?: string;
}

export const useBookingRequests = () => {
  const { currentUser, userRole } = useAuth();
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('sona_read_booking_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only musicians receive external booking requests from landing pages
    if (!currentUser || userRole !== 'musician') {
      setBookingRequests([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'events'),
      where('musicianId', '==', currentUser.uid),
      where('venueId', '==', 'external_booking')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as BookingRequest))
        .filter(req => req.status === 'pending_musician');

      // Sort by date or id
      requests.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setBookingRequests(requests);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching booking requests:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, userRole]);

  const markAsRead = useCallback(async (id: string) => {
    setReadIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem('sona_read_booking_ids', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await updateDoc(doc(db, 'events', id), {
        readByMusician: true
      });
    } catch (e) {
      // Non-fatal if firestore update fails
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const allIds = bookingRequests.map(r => r.id);
    setReadIds(prev => {
      const merged = Array.from(new Set([...prev, ...allIds]));
      try {
        localStorage.setItem('sona_read_booking_ids', JSON.stringify(merged));
      } catch {}
      return merged;
    });

    for (const r of bookingRequests) {
      if (!r.readByMusician) {
        try {
          await updateDoc(doc(db, 'events', r.id), { readByMusician: true });
        } catch {}
      }
    }
  }, [bookingRequests]);

  const unreadBookingRequests = bookingRequests.filter(
    req => !req.readByMusician && !readIds.includes(req.id)
  );

  return {
    bookingRequests,
    unreadBookingRequests,
    unreadBookingCount: unreadBookingRequests.length,
    pendingBookingCount: bookingRequests.length,
    markAsRead,
    markAllAsRead,
    loading
  };
};
