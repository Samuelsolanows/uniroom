import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { CheckCircle2, Home, Users, AlertCircle } from 'lucide-react';

export default function AdminPanel() {
  const [rooms, setRooms] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersMap = {};
      usersSnap.forEach(u => usersMap[u.id] = u.data().name || u.id.substring(0,6));
      setUsersCount(usersSnap.size);

      const querySnapshot = await getDocs(collection(db, 'rooms'));
      const roomsData = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        ownerName: usersMap[doc.data().ownerId] || doc.data().ownerId.substring(0,6)
      }));
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
        <div>
          <h2 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.8rem' }}>Panel de Administración</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>Gestiona usuarios y habitaciones</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-lg)' }}><Home size={28} /></div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}>Habitaciones</p>
            <h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-primary)' }}>{rooms.length}</h3>
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--success-bg)', color: 'var(--success-text)', borderRadius: 'var(--radius-lg)' }}><CheckCircle2 size={28} /></div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}>Verificadas</p>
            <h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-primary)' }}>{rooms.filter(r => r.verified).length}</h3>
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--warning-bg)', color: 'var(--warning-text)', borderRadius: 'var(--radius-lg)' }}><AlertCircle size={28} /></div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}>Pendientes</p>
            <h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-primary)' }}>{rooms.filter(r => !r.verified).length}</h3>
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 'var(--radius-lg)' }}><Users size={28} /></div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}>Usuarios</p>
            <h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-primary)' }}>{usersCount}</h3>
          </div>
        </div>
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
                <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{room.ownerName}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', background: room.status === 'disponible' ? 'var(--success-bg)' : 'var(--error-bg)', color: room.status === 'disponible' ? 'var(--success-text)' : 'var(--error-text)', fontSize: '0.85rem' }}>
                    {room.status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  {room.verified ? (
                    <span style={{ color: '#0284c7', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle2 size={16} /> Sí</span>
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
