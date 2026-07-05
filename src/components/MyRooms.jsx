import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';

export default function MyRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--primary)' }}>Mis Habitaciones Publicadas</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={seedTestData} className="btn" style={{ background: 'var(--accent)', color: 'white' }}>Crear Datos Prueba</button>
          <Link to="/publish" className="btn btn-primary">Nueva Publicación</Link>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No tienes ninguna habitación publicada todavía.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {rooms.map(room => (
            <div key={room.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              {room.images && room.images.length > 0 ? (
                <img src={room.images[0]} alt={room.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '200px', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Sin imagen
                </div>
              )}
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{room.title}</h3>
                  <span style={{ 
                    fontSize: '0.75rem', fontWeight: '600', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)',
                    background: room.status === 'disponible' ? 'var(--primary-light)' : '#fee2e2',
                    color: room.status === 'disponible' ? 'var(--primary-hover)' : '#b91c1c'
                  }}>
                    {room.status}
                  </span>
                </div>
                <p style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem', margin: '0.5rem 0' }}>
                  ${room.price.toLocaleString('es-CO')}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>
                  {room.description.length > 100 ? room.description.substring(0, 100) + '...' : room.description}
                </p>
                
                <button 
                  className="btn" 
                  onClick={() => toggleStatus(room.id, room.status)}
                  style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  Marcar como {room.status === 'disponible' ? 'Ocupada' : 'Disponible'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
