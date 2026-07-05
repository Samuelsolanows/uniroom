import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function AdminPanel() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'rooms'));
      const roomsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRooms(roomsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleVerification = async (roomId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'rooms', roomId), { verified: !currentStatus });
      setRooms(rooms.map(r => r.id === roomId ? { ...r, verified: !currentStatus } : r));
    } catch (err) {
      console.error("Error updating verification:", err);
    }
  };

  if (loading) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Cargando panel...</div>;

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--primary)' }}>Panel de Administración</h2>
        <span style={{ padding: '0.5rem 1rem', background: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-full)', fontWeight: 'bold' }}>
          Solo Administradores
        </span>
      </div>

      <div className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Título</th>
              <th style={{ padding: '1rem' }}>Propietario</th>
              <th style={{ padding: '1rem' }}>Estado</th>
              <th style={{ padding: '1rem' }}>Verificado</th>
              <th style={{ padding: '1rem' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{room.id}</td>
                <td style={{ padding: '1rem', fontWeight: '500' }}>{room.title}</td>
                <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{room.ownerId}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', background: room.status === 'disponible' ? '#dcfce7' : '#fee2e2', color: room.status === 'disponible' ? '#166534' : '#991b1b', fontSize: '0.85rem' }}>
                    {room.status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  {room.verified ? (
                    <span style={{ color: '#0284c7', fontWeight: 'bold' }}>✓ Sí</span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>No</span>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  <button 
                    className="btn" 
                    style={{ background: room.verified ? 'var(--surface)' : '#0284c7', color: room.verified ? 'var(--text-primary)' : 'white', border: room.verified ? '1px solid var(--border)' : 'none', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    onClick={() => toggleVerification(room.id, room.verified)}
                  >
                    {room.verified ? 'Quitar Check' : 'Verificar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
