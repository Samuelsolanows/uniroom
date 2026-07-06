import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { Home, CheckCircle2, Ban, PlusCircle, Edit } from 'lucide-react';

export default function MyRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRooms = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(collection(db, 'rooms'), where('ownerId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const roomsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRooms(roomsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const toggleStatus = async (roomId, currentStatus) => {
    const newStatus = currentStatus === 'disponible' ? 'no_disponible' : 'disponible';
    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, { status: newStatus });
      setRooms(rooms.map(room => room.id === roomId ? { ...room, status: newStatus } : room));
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const seedTestData = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    const dummyRooms = [
      {
        title: "Habitación luminosa cerca a la Unipamplona",
        description: "Excelente habitación con ventana a la calle, escritorio para estudiar y cama doble. A solo 5 minutos caminando de la sede principal.",
        price: 450000,
        services: ["wifi", "bano_privado"],
        images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"],
        status: "disponible"
      },
      {
        title: "Cuarto económico compartido",
        description: "Habitación compartida ideal para estudiantes de primeros semestres que buscan ahorrar. Incluye acceso a zonas comunes.",
        price: 250000,
        services: ["wifi", "cocina"],
        images: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"],
        status: "disponible"
      },
      {
        title: "Apartaestudio Amoblado Premium",
        description: "Espacio totalmente independiente y amoblado con los mejores acabados. Ideal para estudiantes de posgrado o profesores.",
        price: 800000,
        services: ["wifi", "bano_privado", "cocina", "amoblado"],
        images: ["https://images.unsplash.com/photo-1502672260266-1c1de2d93688?auto=format&fit=crop&w=800&q=80"],
        status: "no_disponible"
      }
    ];

    try {
      for (const room of dummyRooms) {
        await addDoc(collection(db, 'rooms'), {
          ...room,
          ownerId: auth.currentUser.uid,
          createdAt: new Date().toISOString()
        });
      }
      fetchRooms(); // Refresh the list
    } catch (err) {
      console.error("Error seeding data:", err);
    }
  };

  if (loading) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Cargando...</div>;

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.status === 'disponible').length;
  const unavailableRooms = totalRooms - availableRooms;

  return (
    <div className="container" style={{ padding: '3rem 0', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h2 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.8rem', lineHeight: '1.2' }}>Dashboard de Publicaciones</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>Administra tus habitaciones publicadas</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={seedTestData} className="btn" style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>Datos Prueba</button>
          <Link to="/publish" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle size={18} /> Nueva Publicación
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-lg)' }}><Home size={28} /></div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}>Total Publicaciones</p>
            <h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-primary)' }}>{totalRooms}</h3>
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--success-bg)', color: 'var(--success-text)', borderRadius: 'var(--radius-lg)' }}><CheckCircle2 size={28} /></div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}>Disponibles</p>
            <h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-primary)' }}>{availableRooms}</h3>
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--error-bg)', color: 'var(--error-text)', borderRadius: 'var(--radius-lg)' }}><Ban size={28} /></div>
          <div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}>Ocupadas</p>
            <h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-primary)' }}>{unavailableRooms}</h3>
          </div>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Home size={48} color="var(--border)" />
          <p style={{ fontSize: '1.1rem' }}>No tienes ninguna habitación publicada todavía.</p>
          <Link to="/publish" className="btn btn-primary">Crear mi primera publicación</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {rooms.map(room => (
            <div key={room.id} className="card flex-mobile-col" style={{ display: 'flex', overflow: 'hidden', minHeight: '180px', position: 'relative' }}>
              
              <div style={{ width: '280px', flexShrink: 0, background: 'var(--border)', cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/room/${room.id}`)}>
                {room.images && room.images.length > 0 ? (
                  <img src={room.images[0]} alt={room.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Sin foto</div>
                )}
                <span style={{ 
                  position: 'absolute', top: '1rem', left: '1rem',
                  fontSize: '0.75rem', fontWeight: 'bold', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)',
                  background: room.status === 'disponible' ? 'var(--success-bg)' : 'var(--error-bg)',
                  color: room.status === 'disponible' ? 'var(--success-text)' : 'var(--error-text)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {room.status === 'disponible' ? 'DISPONIBLE' : 'OCUPADA'}
                </span>
              </div>
              
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 className="text-truncate" style={{ fontSize: '1.3rem', margin: '0 0 0.5rem 0', cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => navigate(`/room/${room.id}`)}>
                    {room.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {room.description}
                  </p>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '1.25rem' }}>
                    <span style={{ fontWeight: '700', color: 'var(--primary)' }}>${room.price.toLocaleString('es-CO')}</span> <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'normal' }}>/ mes</span>
                  </p>
                  
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button 
                      className="btn" 
                      onClick={() => navigate(`/edit-room/${room.id}`)}
                      style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: '0.9rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Edit size={16}/> Editar
                    </button>
                    <button 
                      className="btn" 
                      onClick={() => toggleStatus(room.id, room.status)}
                      style={{ background: room.status === 'disponible' ? 'var(--error-bg)' : 'var(--success-bg)', color: room.status === 'disponible' ? 'var(--error-text)' : 'var(--success-text)', border: 'none', fontSize: '0.9rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      {room.status === 'disponible' ? <><Ban size={16}/> Marcar Ocupada</> : <><CheckCircle2 size={16}/> Marcar Disponible</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
