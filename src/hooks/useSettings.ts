import { useState, useEffect } from 'react';
import { db } from '../firebase/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

export interface AppSettings {
  vibes: string[];
  genres: string[];
}

const defaultSettings: AppSettings = {
  vibes: ["BAILAR", "TARDEO", "ACÚSTICO", "ELECTRÓNICA", "CENA"],
  genres: ["INDIE", "ROCK", "POP", "ELECTRÓNICA", "ACÚSTICO", "JAZZ"]
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'config', 'app_settings');
    
    // Ensure document exists, if not create it with defaults
    const initSettings = async () => {
      try {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          await setDoc(docRef, defaultSettings);
        }
      } catch (e) {
        console.error("Error initializing settings", e);
      }
    };
    
    initSettings();

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AppSettings;
        setSettings({
          vibes: data.vibes || defaultSettings.vibes,
          genres: data.genres || defaultSettings.genres
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateVibes = async (newVibes: string[]) => {
    try {
      await setDoc(doc(db, 'config', 'app_settings'), { vibes: newVibes }, { merge: true });
    } catch (e) {
      console.error("Error updating vibes", e);
      throw e;
    }
  };

  const updateGenres = async (newGenres: string[]) => {
    try {
      await setDoc(doc(db, 'config', 'app_settings'), { genres: newGenres }, { merge: true });
    } catch (e) {
      console.error("Error updating genres", e);
      throw e;
    }
  };

  return { settings, loading, updateVibes, updateGenres };
};
