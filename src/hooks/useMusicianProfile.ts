import { useState, useEffect } from 'react';
import { type MusicianProfile } from '../data/mockMusicianData';
import { db } from '../firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export const useMusicianProfile = (musicianId?: string) => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<MusicianProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetId = musicianId || currentUser?.uid;

  useEffect(() => {
    if (!targetId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'users', targetId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            id: targetId,
            stageName: data.stageName || '',
            formationType: data.formationType || 'solo',
            membersCount: data.membersCount || 1,
            membersNames: data.membersNames || '',
            mainGenre: data.genre || data.mainGenre || '',
            shortBio: data.bio || data.shortBio || '',
            contactPhone: data.phone || data.contactPhone || '',
            contactWhatsapp: data.phone || data.contactWhatsapp || '',
            spotifyUrl: data.spotifyUrl || '',
            youtubeUrl: data.youtubeUrl || '',
            technicalRider: data.technicalRider || '',
            rating: data.rating || 5.0,
            reviewsCount: data.reviewsCount || 0,
            profileImageUrl: data.profileImageUrl || 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400',
            customApplyMessage: data.customApplyMessage || ''
          });
        } else {
          setProfile(null);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [targetId]);

  const updateProfile = async (updates: Partial<MusicianProfile>) => {
    if (!targetId) return;
    try {
      // Mapear campos al modelo de Firestore
      const updateData: any = { ...updates };
      if (updates.mainGenre) updateData.genre = updates.mainGenre;
      if (updates.shortBio) updateData.bio = updates.shortBio;
      if (updates.contactPhone) updateData.phone = updates.contactPhone;

      await updateDoc(doc(db, 'users', targetId), updateData);
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (e) {
      console.error(e);
      alert("Error guardando el perfil.");
    }
  };

  return { profile, loading, error, updateProfile };
};
