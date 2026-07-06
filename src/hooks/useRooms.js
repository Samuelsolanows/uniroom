import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export function useRooms(ownerId = null) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        let q;
        if (ownerId) {
          q = query(collection(db, 'rooms'), where('ownerId', '==', ownerId));
        } else {
          q = query(collection(db, 'rooms'), where('status', '==', 'disponible'));
        }
        
        const querySnapshot = await getDocs(q);
        const roomsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRooms(roomsData);
      } catch (err) {
        console.error("Error fetching rooms:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRooms();
  }, [ownerId]);

  const addRoom = async (roomData) => {
    return await addDoc(collection(db, 'rooms'), {
      ...roomData,
      createdAt: serverTimestamp()
    });
  };

  const updateRoomStatus = async (roomId, newStatus) => {
    await updateDoc(doc(db, 'rooms', roomId), { status: newStatus });
    setRooms(rooms.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
  };

  return { rooms, setRooms, loading, addRoom, updateRoomStatus };
}
