import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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

  return {
    bookingRequests,
    pendingBookingCount: bookingRequests.length,
    loading
  };
};
