import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, doc, updateDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { Calendar, Clock, CheckCircle, XCircle, Ban } from 'lucide-react';

export default function Reservations() {
  const { userData, isAdmin } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('received');

  const [usersMap, setUsersMap] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const map = {};
        snap.forEach(u => map[u.id] = u.data().name || u.id.substring(0, 5));
        setUsersMap(map);
      } catch (err) {
        console.error("Error fetching users map", err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (userData) {
      setView(userData.role === 'propietario' || isAdmin ? 'received' : 'sent');
    }
  }, [userData, isAdmin]);

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
        <h2 style={{ color: 'var(--primary)' }}>
          {view === 'received' ? 'Reservas Recibidas' : 'Mis Solicitudes'}
        </h2>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn" 
              style={{ background: view === 'received' ? 'var(--primary)' : 'var(--surface)', color: view === 'received' ? 'white' : 'var(--text-primary)' }}
              onClick={() => setView('received')}
            >
              Recibidas
            </button>
            <button 
              className="btn" 
              style={{ background: view === 'sent' ? 'var(--primary)' : 'var(--surface)', color: view === 'sent' ? 'white' : 'var(--text-primary)' }}
              onClick={() => setView('sent')}
            >
              Enviadas
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center' }}>Cargando reservas...</div>
      ) : reservations.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No hay reservas para mostrar.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reservations.map(res => {
            const isApproved = res.status === 'aprobada';
            const isRejected = res.status === 'rechazada';
            const isCancelled = res.status === 'cancelada';
            const isPending = res.status === 'pendiente';

            const StatusIcon = isApproved ? CheckCircle : isRejected ? XCircle : isCancelled ? Ban : Clock;
            
            return (
              <div key={res.id} style={{ 
                background: 'var(--surface)', 
                borderRadius: 'var(--radius-lg)', 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {/* Left Ticket Side */}
                  <div style={{ flex: '1 1 60%', padding: '1.5rem', borderRight: '2px dashed var(--border)', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                      <Calendar size={18} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                        {res.createdAt ? new Date(res.createdAt.toMillis()).toLocaleDateString() : 'Reciente'}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{res.roomTitle}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                      {view === 'received' 
                        ? `Solicitado por: ${usersMap[res.studentId] || res.studentId.substring(0,5)}` 
                        : `Propietario: ${usersMap[res.ownerId] || res.ownerId.substring(0,5)}`}
                    </p>
                  </div>
                  
                  {/* Right Ticket Side */}
                  <div style={{ flex: '1 1 40%', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: '#f8fafc' }}>
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', fontWeight: 'bold', fontSize: '0.9rem',
                      background: isApproved ? 'var(--success-bg)' : (isRejected || isCancelled) ? 'var(--error-bg)' : 'var(--warning-bg)',
                      color: isApproved ? 'var(--success-text)' : (isRejected || isCancelled) ? 'var(--error-text)' : 'var(--warning-text)'
                    }}>
                      <StatusIcon size={18} />
                      {res.status.toUpperCase()}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
                      {view === 'received' && isPending && (
                        <>
                          <button className="btn" style={{ background: 'var(--success-text)', color: 'white', flex: 1, padding: '0.5rem' }} onClick={() => handleUpdateStatus(res.id, 'aprobada')}>Aprobar</button>
                          <button className="btn" style={{ background: 'var(--primary)', color: 'white', flex: 1, padding: '0.5rem' }} onClick={() => handleUpdateStatus(res.id, 'rechazada')}>Rechazar</button>
                        </>
                      )}
                      {view === 'sent' && isPending && (
                        <button className="btn" style={{ background: 'var(--primary)', color: 'white', width: '100%', padding: '0.5rem' }} onClick={() => handleUpdateStatus(res.id, 'cancelada')}>Cancelar</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
