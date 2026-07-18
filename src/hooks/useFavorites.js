import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const fetchFavs = async (user) => {
      if (!user) {
        setFavorites([]);
        return;
      }
      const q = query(collection(db, 'favorites'), where('studentId', '==', user.uid));
      const snapshot = await getDocs(q);
      setFavorites(snapshot.docs.map(doc => doc.data().roomId));
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      fetchFavs(user);
    });

    return unsubscribe;
  }, []);

  const toggleFavorite = async (roomId) => {
    if (!auth.currentUser) {
       window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { view: 'register' } }));
       return;
    }
    
    // Optimistic update
    const isFav = favorites.includes(roomId);
    if (isFav) {
      setFavorites(prev => prev.filter(id => id !== roomId));
    } else {
      setFavorites(prev => [...prev, roomId]);
    }

    try {
      const q = query(collection(db, 'favorites'), where('studentId', '==', auth.currentUser.uid), where('roomId', '==', roomId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        // Remove favorite
        await deleteDoc(snapshot.docs[0].ref);
      } else {
        // Add favorite
        await addDoc(collection(db, 'favorites'), { 
          studentId: auth.currentUser.uid, 
          roomId,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Error toggling favorite", err);
      // Revert optimistic update on failure
      if (isFav) {
        setFavorites(prev => [...prev, roomId]);
      } else {
        setFavorites(prev => prev.filter(id => id !== roomId));
      }
    }
  };

  return { favorites, toggleFavorite };
}
