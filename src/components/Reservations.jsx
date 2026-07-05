import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('received'); // 'received' (owner) or 'sent' (student)

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Determine the field to query based on view
    const fieldPath = view === 'received' ? 'ownerId' : 'studentId';
    
    const q = query(collection(db, 'reservations'), where(fieldPath, '==', auth.currentUser.uid));
    
    // We use onSnapshot for realtime updates on reservations
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory (newest first)
      resData.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setReservations(resData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reservations:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [view]);

  const handleUpdateStatus = async (resId, newStatus) => {
    try {
      await updateDoc(doc(db, 'reservations', resId), { status: newStatus });
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  if (!auth.currentUser) return <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>Debes iniciar sesión.</div>;

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--primary)' }}>Gestión de Reservas</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn" 
            style={{ background: view === 'received' ? 'var(--primary)' : 'var(--surface)', color: view === 'received' ? 'white' : 'var(--text-primary)' }}
            onClick={() => setView('received')}
          >
            Recibidas (Propietario)
          </button>
          <button 
            className="btn" 
            style={{ background: view === 'sent' ? 'var(--primary)' : 'var(--surface)', color: view === 'sent' ? 'white' : 'var(--text-primary)' }}
            onClick={() => setView('sent')}
          >
            Mis Solicitudes (Estudiante)
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center' }}>Cargando reservas...</div>
      ) : reservations.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No hay reservas para mostrar.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reservations.map(res => (
            <div key={res.id} className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{res.roomTitle}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {view === 'received' ? `Solicitada por el estudiante: ${res.studentId}` : `Propietario ID: ${res.ownerId}`}
                </p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ 
                  padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontWeight: '600', fontSize: '0.85rem',
                  background: res.status === 'aprobada' ? '#dcfce7' : res.status === 'rechazada' ? '#fee2e2' : '#fef9c3',
                  color: res.status === 'aprobada' ? '#166534' : res.status === 'rechazada' ? '#991b1b' : '#854d0e'
                }}>
                  {res.status.toUpperCase()}
                </span>
                
                {view === 'received' && res.status === 'pendiente' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" style={{ background: '#22c55e', color: 'white' }} onClick={() => handleUpdateStatus(res.id, 'aprobada')}>Aprobar</button>
                    <button className="btn" style={{ background: '#ef4444', color: 'white' }} onClick={() => handleUpdateStatus(res.id, 'rechazada')}>Rechazar</button>
                  </div>
                )}
                {view === 'sent' && res.status === 'pendiente' && (
                  <button className="btn" style={{ background: '#ef4444', color: 'white' }} onClick={() => handleUpdateStatus(res.id, 'cancelada')}>Cancelar Solicitud</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
