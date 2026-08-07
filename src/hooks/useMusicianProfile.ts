import { useState, useEffect } from 'react';
import { type MusicianProfile, mockMusicianProfile } from '../data/mockMusicianData';

export const useMusicianProfile = (musicianId?: string) => {
  const [profile, setProfile] = useState<MusicianProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulamos la latencia de Firebase (luego aquí irá un getDoc real)
    const fetchProfile = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 600));
        setProfile(mockMusicianProfile);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [musicianId]);

  const updateProfile = async (updates: Partial<MusicianProfile>) => {
    // Simulamos actualización en Firebase
    await new Promise(resolve => setTimeout(resolve, 800));
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  return { profile, loading, error, updateProfile };
};
